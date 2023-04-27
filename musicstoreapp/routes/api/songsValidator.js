const{check} = require('express-validator');

exports.songValidatorInsert = [
    check('title', 'Title is required').trim().not().isEmpty(),
    check('title', 'Title must be 5 or more characters').trim().isLength({min:5}),
    check('kind', 'Kind is required').trim().not().isEmpty(),
    check('kind', 'Kind must be 3 or more characters').trim().isLength({min:3}),
    check('price', 'Price is required').trim().not().isEmpty(),
    check('price', 'Price must be a number').isNumeric(),
    check('price').custom(value => {
        if(value < 0){
            throw Error('Price must be greater than zero')
        }
        return true;
    })
]
exports.songValidatorUpdate = [
    check('title').if(check('title').exists()).trim().isEmpty().withMessage('Title is required'),
    check('title').if(check('title').exists()).trim().isLength({min:5}).withMessage('Title must be 5 or more characters'),
    check('kind').if(check('kind').exists()).trim().isEmpty().withMessage('Kind is required'),
    check('kind').if(check('kind').exists()).trim().isLength({min:3}).withMessage('Kind must be 3 or more characters'),
    check('price').if(check('price').exists()).trim().isEmpty().withMessage('Price is required'),
    check('price').if(check('price').exists()).trim().isNumeric().withMessage('Price must be a number'),
    check('price').if(check('price').exists()).custom(value => {
        if(value < 0){
            throw Error('Price must be greater than zero')
        }
        return true;
    })
]