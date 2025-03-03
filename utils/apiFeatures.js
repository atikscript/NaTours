
class APIfeatures {
    constructor( query, queryString) {
        this.query= query;
        this.queryString= queryString;
    }

    filter (){
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering - documentation is important
        let queryStr = JSON.stringify(queryObj); // now we can use queryStr to use replace function
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        console.log('Query String:', JSON.parse(queryStr));

        this.query = this.query.find(JSON.parse(queryStr));

        return this;
    }

    sort () {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;

    }

    limitFields (){
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields); // projecting
        } else {
            this.query = this.query.select('-__v');
        }
        
        return this;
    }

    paginate(){

        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 200;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;

    }

}


module.exports = APIfeatures;