import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types} from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pokemon' }], default: [] })
  caughtPokemons: Types.ObjectId[];
}

export type UserDocument = User & Document;

export const UserSchema = SchemaFactory.createForClass(User);
