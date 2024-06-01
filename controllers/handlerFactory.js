const catchAsync = require('../Utils/catchAsync');
const AppError = require('../Utils/appError');
const APIFeatures = require('../Utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //204 means no content
    const document = await Model.findByIdAndDelete(req.params.id);
    if (!document) {
      return next(new AppError(` document with that id not found`, 404));
    }
    res.status(204).json({
      status: 'success',
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!document) {
      return next(new AppError(`document with that id not found`, 404));
    }
    // const updatedTour = await Tour.update(tourId);
    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDocument = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: newDocument,
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const document = await query;

    if (!document) {
      return next(new AppError(`document with that id not found`, 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on Tours (a small hack :) )
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    console.log(req.query);
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();
    //testing indexing
    // const allDocuments = await features.query.explain();

    const allDocuments = await features.query;
    console.log(req.requestTime);
    res.status(200).json({
      status: 'success',
      result: allDocuments.length,
      data: {
        data: allDocuments,
      },
    });
  });
