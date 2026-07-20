import mongoose from 'mongoose';
const counterSchema = new mongoose.Schema({ _id: String, value: { type: Number, required: true } });
export default mongoose.model('Counter', counterSchema);
