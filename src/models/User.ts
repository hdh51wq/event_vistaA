import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  agencyName: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
    customFurniture?: Array<{
      id: string;
      label: string;
      views: {
        front: string;
        back?: string;
        left?: string;
        right?: string;
      };
      defaultWidth: number;
      defaultHeight: number;
      price?: number;
    }>;
  }
  
  const UserSchema: Schema = new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      password: { type: String },
      agencyName: { type: String, default: 'My Agency' },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      customFurniture: [
        {
          id: String,
          label: String,
          views: {
            front: String,
            back: String,
            left: String,
            right: String,
          },
          defaultWidth: Number,
          defaultHeight: Number,
          price: Number,
        },
      ],
    },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
