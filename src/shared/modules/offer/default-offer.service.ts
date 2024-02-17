import { inject, injectable } from 'inversify';
import { OfferService } from './offer-service.interface.js';
import { Component } from '../../types/index.js';
import { Logger } from '../../libs/logger/index.js';
import { DocumentType, types } from '@typegoose/typegoose';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { OfferEntity } from './offer.entity.js';
import { Types } from 'mongoose';
import { CreateOfferDto } from './dto/create-offer.dto.js';

const userId = '65bf3f34400ed55a3f2e4589';

const favoriteOffersPipeline = [
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'users' } },
  { $addFields: { user: { $arrayElemAt: [ '$users', 0 ] } } },
  { $lookup:
    {
      from: 'users',
      let: { userId: new Types.ObjectId(userId) },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } }
      ],
      as: 'specificUser'
    }
  },
  { $addFields: { specificUser: { $arrayElemAt: [ '$specificUser', 0 ] } } },
  { $addFields: { 'specificUser.favorites': { $ifNull: [ '$specificUser.favorites', [] ] } } },
  { $addFields: { isFavorite: { $in: [ '$_id', '$specificUser.favorites' ] } } },
  { $lookup: { from: 'comments', localField: '_id', foreignField: 'offerId', as: 'comments' } },
  { $addFields: { commentCount: { $size: '$comments' }, commentRating: { $sum: '$comments.rating' } } },
  { $addFields:
    {
      rating: {
        $cond: {
          if: {
            $eq: ['$commentsCount', 0]
          },
          then: 0,
          else: { $divide: ['$commentRating', '$commentsCount'] }
        }
      }
    }
  },
  { $unset: ['users', 'userId', 'specificUser', 'comments', 'commentRating'] },
];

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>
  ) {}

  public async create(dto: CreateOfferDto): Promise<DocumentType<OfferEntity>> {
    const result = await this.offerModel.create(dto);
    this.logger.info(`New offer created: ${dto.title}`);

    return result;
  }

  public async findById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    const result = await this.offerModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(offerId) } },
        ...favoriteOffersPipeline,
      ])
      .exec();

    return result?.[0];
  }

  public async find(): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .aggregate([...favoriteOffersPipeline])
      .exec();
  }

  public async deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndDelete(offerId)
      .exec();
  }

  public async updateById(offerId: string, dto: UpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    const result = await this.offerModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(offerId) } },
        ...favoriteOffersPipeline,
      ])
      .exec();

    const offer = result?.[0];

    if (offer) {
      await this.offerModel.updateOne({ _id: offer._id }, dto).exec();
      return this.offerModel.findById(offer._id).exec();
    }

    return null;
  }

  public async incCommentCount(offerId: string): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel
      .findByIdAndUpdate(offerId, {'$inc': {
        commentCount: 1,
      }}).exec();
  }

  public async findPremium(city: string): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .aggregate([
        { $match: { city, isPremium: true } },
        ...favoriteOffersPipeline,
      ])
      .exec();
  }

  public async findFavorite(): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel
      .aggregate([
        ...favoriteOffersPipeline,
        { $match: { isFavorite: true } },
      ])
      .exec();
  }

  public async exists(offerId: string): Promise<boolean> {
    return (await this.offerModel
      .exists({_id: offerId})) !== null;
  }
}
