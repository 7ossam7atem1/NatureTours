const Review = require('../models/reviewModel');
const catchAsync = require('../Utils/catchAsync');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };

//   const allReviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'Success',
//     result: allReviews.length,
//     data: {
//       allReviews,
//     },
//   });
// });

exports.getAllReviews = factory.getAll(Review);
exports.setTourandUserIds = (req, res, next) => {
  //Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);
exports.deleteReview = factory.deleteOne(Review);
