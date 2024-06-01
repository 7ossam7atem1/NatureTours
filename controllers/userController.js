const fs = require('fs');
const multer = require('multer');
const cloudinary = require('../Utils/cloudinary');
const sharp = require('sharp');
const crypto = require('crypto');

const User = require('../models/userModel');
const AppError = require('../Utils/appError');
const catchAsync = require('../Utils/catchAsync');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('Not an image, Please upload correct file(only images)'),
      false,
    );
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  const resizedImageBuffer = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpg')
    .jpeg({ quality: 100 })
    .toBuffer();
  cloudinary.v2.uploader
    .upload_stream(
      {
        resource_type: 'image',
        folder: 'userimages',
        public_id: `user-${req.user.id}`,
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

        req.file.cloudinaryUrl = result.secure_url;
        req.file.cloudinaryPublicId = result.public_id;
        console.log(
          'Image uploaded successfully, public ID:',
          result.public_id,
        );
        next();
      },
    )
    .end(resizedImageBuffer);
});

const filterObj = (obj, ...allowedFieldsToUpdate) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFieldsToUpdate.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  // Check if a new photo was uploaded
  if (req.file && req.file.cloudinaryUrl && req.file.cloudinaryPublicId) {
    // If a new photo was uploaded, update the photo URL and public ID in the request body
    req.body.photo = {
      url: req.file.cloudinaryUrl,
      publicId: req.file.cloudinaryPublicId,
    };
  }

  // Check if the request contains password-related fields
  if (req.body.password || req.body.passwordConfirm) {
    // Return an error if the user is attempting to update their password through this route
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400,
      ),
    );
  }

  // Filter out unwanted fields from the request body
  const filteredBody = filterObj(req.body, 'name', 'email', 'photo');

  // Update the user document in the database
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return the updated document
    runValidators: true, // Run validators to ensure data integrity
  });

  // Send the updated user data in the response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active: false,
  });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'success',
    message: "This route isn't defined! / Please use /signup instead",
  });
};

//DO NOT update passwords with this !
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
