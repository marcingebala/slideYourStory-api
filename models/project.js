import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const projectSchema = new Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  slides: [{type: String}],
  owners: [{type: String}],
  created_at: Date,
  updated_at: Date
});

export default  mongoose.model('Project', projectSchema);
