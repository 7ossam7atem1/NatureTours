const multer = require('multer');
const sharp = require('sharp');
const cloudinary = require('../Utils/cloudinary');
// const cloudinary = require('cloudinary');

const Tour = require('../models/tourModel');
const catchAsync = require('../Utils/catchAsync');
const APIFeatures = require('../Utils/apiFeatures');
const AppError = require('../Utils/appError');
const factory = require('./handlerFactory');
// const {Readable} = require('stream');
// const fs = require('fs').promises;
// const { tmpdir } = require('os');
// const { join } = require('path');
// const streamifier = require('streamifier');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//     // Resize and upload cover image
//     const imageCoverBuffer = await sharp(req.files.imageCover[0].buffer)
//       .resize(2000, 1333)
//       .toBuffer();

//     const imageCoverUploadPromise = new Promise((resolve) => {
//       cloudinary.v2.uploader
//         .upload_stream(
//           {
//             resource_type: 'image',
//             folder: 'tourCovers',
//             public_id: `tour-${req.params.id}-coverimage`,
//             overwrite: true,
//             invalidate: true,
//           },
//           (err, result) => {
//             if (err) {
//               return next(new AppError('Error uploading the image to Cloudinary', 500));
//             }

//             if (!result || !result.secure_url || !result.public_id) {
//               return next(new AppError('Cloudinary upload failed', 500));
//             }

//             // Resolve with the URL only, not the entire object
//             resolve(result.secure_url);
//           }
//         )
//         .end(imageCoverBuffer);
//     });

//     const imageCoverUrl = await imageCoverUploadPromise;
//     req.body.imageCover = imageCoverUrl;

//     // Resize and upload tour images
//     const imagesUploadPromises = req.files.images.map(async (file, i) => {
//       const imageBuffer = await sharp(file.buffer).resize(2000, 1333).toBuffer();

//       const imageUploadPromise = new Promise((resolve) => {
//         cloudinary.v2.uploader
//           .upload_stream(
//             {
//               resource_type: 'image',
//               folder: 'tours',
//               public_id: `tour-${req.params.id}-${i + 1}`,
//               overwrite: true,
//               invalidate: true,
//             },
//             (err, result) => {
//               if (err) {
//                 return next(new AppError('Error uploading the image to Cloudinary', 500));
//               }

//               if (!result || !result.secure_url || !result.public_id) {
//                 return next(new AppError('Cloudinary upload failed', 500));
//               }

//               // Resolve with the URL only, not the entire object
//               resolve(result.secure_url);
//             }
//           )
//           .end(imageBuffer);
//       });

//       return imageUploadPromise;
//     });

//     const imagesUploadResults = await Promise.all(imagesUploadPromises);
//     req.body.images = imagesUploadResults;

//     next();

// });



exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  const imageCoverBuffer = await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toBuffer();

  const imageCoverUploadPromise = new Promise((resolve, reject) => {
    cloudinary.v2.uploader
      .upload_stream(
        {
          resource_type: 'image',
          folder: 'tourCovers',
          public_id: `tour-${req.params.id}-coverimage`,
          overwrite: true,
          invalidate: true,
        },
        async (err, result) => {
          if (err) {
            return next(
              new AppError('Error uploading the image to Cloudinary', 500),
            );
          }

          if (!result || !result.secure_url || !result.public_id) {
            return next(new AppError('Cloudinary upload failed', 500));
          }

          resolve(result.secure_url);
        },
      )
      .end(imageCoverBuffer);
  });

  const imageCoverUrl = await imageCoverUploadPromise;

  req.body.imageCover = imageCoverUrl;

  const imagesUploadPromises = req.files.images.map(async (file, i) => {
    const imageBuffer = await sharp(file.buffer).resize(2000, 1333).toBuffer();

    const imageUploadPromise = new Promise((resolve, reject) => {
      cloudinary.v2.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'tours',
            public_id: `tour-${req.params.id}-${i + 1}`,
            overwrite: true,
            invalidate: true,
          },
          async (err, result) => {
            if (err) {
              return next(
                new AppError('Error uploading the image to Cloudinary', 500),
              );
            }

            if (!result || !result.secure_url || !result.public_id) {
              return next(new AppError('Cloudinary upload failed', 500));
            }

            resolve(result.secure_url);
          },
        )
        .end(imageBuffer);
    });

    return imageUploadPromise;
  });

  const imagesUploadResults = await Promise.all(imagesUploadPromises);
  req.body.images = imagesUploadResults;

  next();
});

// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//   const imageCoverBuffer = await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toBuffer();

//   const imageCoverPath = join(tmpdir(), `${Date.now()}-imageCover.jpg`);
//   await fs.writeFile(imageCoverPath, imageCoverBuffer);

//   const imageCoverUpload = await cloudinary.uploader.upload(imageCoverPath, {
//     folder: 'tours'
//   });

//   req.body.imageCover = imageCoverUpload.secure_url;

//   const imagesUploadPromises = req.files.images.map(async (file, i) => {
//     const imageBuffer = await sharp(file.buffer).resize(2000, 1333).toBuffer();

//     const imagePath = join(tmpdir(), `${Date.now()}-image-${i}.jpg`);
//     await fs.writeFile(imagePath, imageBuffer);

//     const uploadResult = await cloudinary.uploader.upload(imagePath, {
//       folder: 'tours'
//     });

//     await fs.unlink(imagePath);

//     return uploadResult.secure_url;
//   });

//   const imagesUploadResults = await Promise.all(imagesUploadPromises);
//   req.body.images = imagesUploadResults;

//   await fs.unlink(imageCoverPath);

//   next();
// });

// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//   const imageCoverBuffer = await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toBuffer();

//   const imageCoverPath = join(tmpdir(), `${Date.now()}-imageCover.jpg`);
//   await fs.writeFile(imageCoverPath, imageCoverBuffer);

//   const imageCoverUpload = await cloudinary.uploader.upload(imageCoverPath, {
//     folder: 'tourcovers',

//   });

//   req.body.imageCover = imageCoverUpload.secure_url;

//   const imagesUploadPromises = req.files.images.map(async (file, i) => {
//     const imageBuffer = await sharp(file.buffer).resize(2000, 1333).toBuffer();

//     const imagePath = join(tmpdir(), `${Date.now()}-image-${i}.jpg`);
//     await fs.writeFile(imagePath, imageBuffer);

//     const uploadResult = await cloudinary.uploader.upload(imagePath, {
//       folder: 'tourimages',
//     });

//     await fs.unlink(imagePath);

//     return uploadResult.secure_url;
//   });

//   const imagesUploadResults = await Promise.all(imagesUploadPromises);
//   req.body.images = imagesUploadResults;

//   await fs.unlink(imageCoverPath);

//   next();
// });

// upload.single('image') req.file
// upload.array('images', 5) req.files

// exports.resizeTourImages = catchAsync(async (req, res, next) => {
//   if (!req.files.imageCover || !req.files.images) return next();

//   // 1) Cover image
//   req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
//   await sharp(req.files.imageCover[0].buffer)
//     .resize(2000, 1333)
//     .toFormat('jpeg')
//     .jpeg({ quality: 90 })
//     .toFile(`public/img/tours/${req.body.imageCover}`);

//   // 2) Images
//   req.body.images = [];

//   await Promise.all(
//     req.files.images.map(async (file, i) => {
//       const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

//       await sharp(file.buffer)
//         .resize(2000, 1333)
//         .toFormat('jpeg')
//         .jpeg({ quality: 90 })
//         .toFile(`public/img/tours/${filename}`);

//       req.body.images.push(filename);
//     })
//   );

//   next();
// });

// Helper function to upload image buffer to Cloudinary

exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price, ratingsAverage, summary, difficulty';
  next();
};

// exports.getAlltours = catchAsync(async (req, res, next) => {
//   console.log(req.query);
//   //Building the query
//   // 1)- Filtering
//   // const queryObj = { ...req.query };
//   // const execludedFields = ['page', 'sort', 'limit', 'fields'];
//   // execludedFields.forEach((field) => {
//   //   delete queryObj[field];
//   // });

//   // //2)Advanced filtering
//   // let queryStr = JSON.stringify(queryObj);
//   // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => {
//   //   return `$${match}`;
//   // });
//   // //gte , gt , lt , lte
//   // //{difficulty: "easy" , duration: {$gte: 5}} //filtering object
//   // //{ duration: { gte: '5' }, difficulty: 'easy' } //query object
//   // //{ duration: { '$gte': '5' }, difficulty: 'easy' }//query object after parsing
//   // let query = Tour.find(JSON.parse(queryStr));

//   //2) Sorting
//   // if (req.query.sort) {
//   //   const sortBy = req.query.sort.split(',').join(' ');
//   //   console.log(sortBy);
//   //   query = query.sort(sortBy);
//   // } else {
//   //   //default sorting by creation time
//   //   query = query.sort('-createdAt');
//   // }

//   // 3) Field Limiting
//   // if (req.query.fields) {
//   //   const fields = req.query.fields.split(',').join(' ');
//   //   console.log(fields);
//   //   query = query.select(fields);
//   // } else {
//   //   query = query.select('-__v');
//   // }
//   //4) Pagination
//   // const page = req.query.page * 1 || 1;
//   // const limit = req.query.limit * 1 || 100;
//   // const skip = (page - 1) * limit;
//   // //page=2,limit=10 --> 1 to 10 for page 1 and 11-20 for page 2 , 21-30 for page 3 and so on..
//   // query = query.skip(skip).limit(limit);
//   // if (req.query.page) {
//   //   const numTours = await Tour.countDocuments();
//   //   if (skip >= numTours) throw new Error("This page doesn't Exist");
//   // }
//   //Executing the query
//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   // console.log(features);
//   const allTours = await features.query;
//   // const allTours = await query;
//   //filtering using some mongo special methods chaining
//   // const query = Tour.find()
//   //   .where('duration')
//   //   .equals(5)
//   //   .where('difficulty')
//   //   .equals('easy');
//   console.log(req.requestTime);
//   //send response
//   res.status(200).json({
//     status: 'success',
//     result: allTours.length,
//     data: {
//       allTours,
//     },
//   });
// });

// exports.getTour = catchAsync(async (req, res, next) => {
//   const tourId = req.params.id;
//   const tour = await Tour.findById(tourId)
//     // .populate({
//     //   path: 'guides',
//     //   select:
//     //     '-__v -passwordResetExpires -passwordResetToken -passwordChangedAt',
//     // })
//     .populate('reviews');
//   // const tour = await Tour.findOne({_id: req.params.id});
//   if (!tour) {
//     return next(new AppError(`Tour with that id not found`, 404));
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour,
//     },
//   });
// });

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        // _id: '$ratingsAverage',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const monthlyplan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year + 1}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    result: monthlyplan.length,
    data: {
      monthlyplan,
    },
  });
});
//'/tours-within/:distance/:center/:34.054180, -118.367855/unit/:unit',
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  console.log(radius);
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please Provide  latitude and longitude in correct format lat,lng.',
        400,
      ),
    );
  }

  console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  if (!lat || !lng) {
    return next(
      new AppError(
        'Please Provide latitude and longitude in correct format lat,lng.',
        400,
      ),
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
//gte , gt , lt , lte
//{difficulty: "easy" , duration: {$gte: 5}} //filtering object
//{ duration: { gte: '5' }, difficulty: 'easy' } //query object
//{ duration: { '$gte': '5' }, difficulty: 'easy' }//query object after parsing
