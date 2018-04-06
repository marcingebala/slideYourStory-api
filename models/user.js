import mongoose from 'mongoose';
import uuid from 'uuid/v4';

const Schema = mongoose.Schema;

const userSchema = new Schema({
  _id: {
    type: String,
    default: () => uuid()
  },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  domains: [{type: String, default:'slideyourstory.com'}]
},
{ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('User', userSchema);
