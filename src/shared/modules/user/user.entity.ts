import { defaultClasses, getModelForClass, prop, modelOptions, Ref } from '@typegoose/typegoose';
import { User, UserType } from '../../types/index.js';
import { createSHA256 } from '../../helpers/index.js';
import { OfferEntity } from '../offer/index.js';

export interface UserEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'users',
  }
})

export class UserEntity extends defaultClasses.TimeStamps implements User {
  @prop({
    required: true,
    minlength: [1, 'Min length for name is 1'],
    maxlength: [15, 'Max length for name is 15'],
    trim: true,
  })
  public name!: string;

  @prop({
    unique: true,
    required: true,
    match: [/^([\w-\\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Email is incorrect'],
    trim: true,
  })
  public email!: string;

  @prop({
    required: false,
    default: '',
    match: [/^(.*\.(jpg|png))$/, 'Avatar must be a JPG or PNG image']
  })
  public avatar: string;

  @prop({
    required: true,
    minlength: [6, 'Min length for password is 6'],
    trim: true,
  })
  public password!: string;

  @prop({
    required: true,
    type: () => String,
    enum: UserType,
  })
  public userType!: UserType;

  @prop({
    default: [],
    ref: () => UserEntity,
  })
  public favorites!: Ref<OfferEntity>[];

  constructor(userData: User) {
    super();

    this.name = userData.name;
    this.email = userData.email;
    this.avatar = userData.avatar;
    this.userType = userData.userType;
  }

  public setPassword(password: string, salt: string) {
    this.password = createSHA256(password, salt);
  }

  public getPassword() {
    return this.password;
  }

  public verifyPassword(password: string, salt: string) {
    const hashPassword = createSHA256(password, salt);
    return hashPassword === this.password;
  }
}

export const UserModel = getModelForClass(UserEntity);
