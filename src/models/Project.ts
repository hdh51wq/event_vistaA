import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  name: string;
  client: string;
  event: string;
  eventType: 'Wedding' | 'Conference' | 'Gala Dinner';
  location: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Final';
  thumbnail: string;
  sceneCount: number;
  budget: number;
  currency: string;
  billingStatus: 'pending' | 'paid' | 'cancelled';
  data?: any;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema: Schema = new Schema(
  {
    name:          { type: String, required: true },
    client:        { type: String },
    event:         { type: String },
      eventType:     { type: String, enum: ['Wedding', 'Conference', 'Gala Dinner'], default: 'Wedding' },
    location:      { type: String },
    status:        { type: String, enum: ['Draft', 'In Progress', 'Review', 'Final'], default: 'Draft' },
    thumbnail:     { type: String, default: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800&auto=format&fit=crop' },
    sceneCount:    { type: Number, default: 0 },
    budget:        { type: Number, default: 0 },
    currency:      { type: String, default: 'USD' },
    billingStatus: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    data:          { type: Schema.Types.Mixed },
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Delete cached model in dev so schema changes are picked up on hot reload
if (process.env.NODE_ENV !== 'production' && mongoose.models.Project) {
  delete mongoose.models.Project;
}

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
