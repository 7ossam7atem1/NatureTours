const AppError = require('./appError');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const execludedFields = ['page', 'sort', 'limit', 'fields'];
    execludedFields.forEach((field) => {
      delete queryObj[field];
    });

    //2)Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => {
      return `$${match}`;
    });
    this.query.find(JSON.parse(queryStr));
    // let query = Tour.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      //default sorting by creation time
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      console.log(fields);
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //page=2,limit=10 --> 1 to 10 for page 1 and 11-20 for page 2 , 21-30 for page 3 and so on..
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  search() {
    const { name, price } = this.queryString;
    const filter = {};

    if (name) filter.name = { $regex: name, $options: 'i' };
    if (!Number.isNaN(parseFloat(price)) && Number.isFinite(price))
      filter.price = parseInt(price, 10);

    this.query.find(filter);

    return this;
  }
}

module.exports = APIFeatures;
