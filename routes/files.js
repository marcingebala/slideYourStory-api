import express from 'express';
import multipart from 'connect-multiparty';
import fs from 'fs-extra';
import sharp from 'sharp';
import redis from 'redis';
import uuid from 'uuid/v4';

import imagemin from 'imagemin';
import imageminJpegtran from 'imagemin-jpegtran';
import imageminPngquant from 'imagemin-pngquant';

import ffmpeg from 'fluent-ffmpeg';
import bluebird from 'bluebird'

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const router = express.Router();
const multipartMiddleware = multipart();
const clientRedis = redis.createClient({db:0})
const Queue = require('bee-queue');
const addQueue = new Queue('addition');

const parseImg = new Queue('parseImg')
parseImg.process(3, (job, done) => {

  clientRedis
    .getAsync('bq:parseImgActual')
    .then( res => {
      if(parseInt(res) < parseInt(job.id)) clientRedis.set("bq:parseImgActual", job.id)
    })

  sharp(`./files/tmp/${job.data.path}`)
    .resize(1920, 1080)
    .max()
    .toFile(`./files/resize/${job.data.path}`)
    .then(() => imagemin([`./files/resize/${job.data.path}`], './files/done/', {
        plugins: [
          imageminJpegtran(),
          imageminPngquant({quality: '65-80'})
        ]
      })
    )
    .then(() => fs.remove(`./files/tmp/${job.data.path}`))
    .then(() => fs.remove(`./files/resize/${job.data.path}`))
    .then(() => {
      clientRedis.hmset(`files:${job.data.uuidTransaction}`, {
        [`${job.data.uuid}`]: JSON.stringify({
          ...job.data,
          job_id: job.id,
          progress: 100,
          status: 'done'
        })
      }, () => {
        done();
        console.log('KONIEC!');
      })
    })
    .catch( err => clientRedis.hmset(`files:${job.data.uuidTransaction}`, {
      [`${job.data.uuid}`]: JSON.stringify({
        ...job.data,
        job_id: job.id,
        progress: 0,
        status: 'error',
        errorMessage: err
      })
    }));
});

const parseVideo = new Queue('parseVideo')
parseVideo.process(1, (job, done) => {

  clientRedis
    .getAsync('bq:parseVideoActual')
    .then( res => {
      if(parseInt(res) < parseInt(job.id)) clientRedis.set("bq:parseVideoActual", job.id)
    })

  ffmpeg.ffprobe(`./files/tmp/${job.data.path}`, (err, metadata) => {
    const newWidth = metadata.streams[0].width > 720 ? 720 : metadata.streams[0].width;
  try{
  ffmpeg(`./files/tmp/${job.data.path}`)
    .size(`${newWidth}x?`)
    .fps(30)
    .videoBitrate('512k')
    .output(`./files/done/${job.data.uuid}.mp4`)
    .on('progress', progress => {
      console.log(`Job ${job.id}, ${Math.round(progress.percent)}%`)
      clientRedis.hmset(`files:${job.data.uuidTransaction}`, {
        [`${job.data.uuid}`]: JSON.stringify({
          ...job.data,
          job_id: job.id,
          progress: Math.round(progress.percent),
          status: 'in progress'
        })
      })

    })
    .on('end', (stdout, stderr) => {

      clientRedis.hmset(`files:${job.data.uuidTransaction}`, {
        [`${job.data.uuid}`]: JSON.stringify({
          ...job.data,
          job_id: job.id,
          progress: 100,
          status: 'done'
        })
      });

      fs
        .remove(`./files/tmp/${job.data.path}`)
        .then(() => done());
    })
    .on('error', (err, stdout, stderr) => {
      clientRedis.hmset(`files:${job.data.uuidTransaction}`, {
        [`${job.data.uuid}`]: JSON.stringify({
          ...job.data,
          job_id: job.id,
          status: 'error',
          message: err.message
        })
      })
    })
    .run();
  } catch(e){
    console.log(e);
  }
  });
});


const createNewJob = data => {

  const type = ['avi','mp4'].includes(data.ext) ? 'video' : 'img';
  const job = (type === 'video') ? parseVideo.createJob({...data,type}) : parseImg.createJob({...data,type});

  job
    .save()
    .then( job => {
      clientRedis.hmset(`files:${data.uuidTransaction}`, {
        [`${data.uuid}`]: JSON.stringify({
          ...data,
          type,
          job_id: job.id,
          progress: 0,
          status: 'create new job'
        })
      });
    })
    .catch( err => console.log(err));
    job.on('failed', (job) => {
      console.log(`Job ${job.id} failed with error ${job}`);
    });
}

router.get('/:uuid', (req, res, next) => {
  clientRedis.hgetall(`files:${req.params.uuid}`, (err, files) => {

    clientRedis.multi().get('bq:parseVideoActual').get('bq:parseImgActual').execAsync().then( data => {
      const [parseVideoActualId,parseImgActualId] = data;
      if(files){
        Object.keys(files).map(hash => {
          files[hash] = JSON.parse(files[hash]);
          if(files[hash].type === 'video'){
            files[hash].queue = parseInt(files[hash].job_id) - parseInt(parseVideoActualId);
          } else {
            files[hash].queue = parseInt(files[hash].job_id) - parseInt(parseImgActualId);
          }
        })
        res.json(files);
      } else{
        res.sendStatus(404);
      }
    });
  });
});

router.post('/', multipartMiddleware, (req, res, done) => {
req.files.files =  Array.isArray(req.files.files) ? req.files.files : [req.files.files];
  const uuidTransaction = uuid();
  req.files.files.map( file => {

    const uuidFile = uuid();
    const ext = file.path.split('.')[1];
    let actualParseId;

    return new Promise((resolve, reject) => {
      if(['jpg','jpeg','png','gif','avi','mp4'].includes(ext)) {
        return resolve();
      } else {
        fs.remove(file.path);
        return reject('niepoprawny format pliku');
      }
    })
    .then(newActualParseId => {
      actualParseId = newActualParseId;
    })
    .then(() => fs.copy(file.path, `./files/tmp/${uuidFile}.${ext}`))
    .then(() => fs.remove(file.path))
    .then(() => createNewJob({
      uuid: uuidFile,
      uuidTransaction: uuidTransaction,
      name:file.name,
      size:file.size,
      path: `${uuidFile}.${ext}`,
      ext: ext
    }))
    .catch( err => {
      console.log(err)
      return 'errror';
    }
    )
  })

  return res.json({"uuidTransaction":uuidTransaction});
});


module.exports = router;
