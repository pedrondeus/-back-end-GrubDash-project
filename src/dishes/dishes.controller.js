const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass



function update(req, res) {
    const dishId = req.params.dishId
   
    const foundDish = dishes.find((dish) => dish.id === dishId)
    const { data: { name, description, price, image_url } = {} } = req.body
   
    foundDish.description = description
    foundDish.name = name
    foundDish.price = price
    foundDish.image_url = image_url
   
    res.json({ data: foundDish })
  }



function create(req, res, next){
  const { data: { name, description, price, image_url } = {} } = req.body
  
  const newData = {
    name,
    description,
    price,
    image_url,
    id: nextId(),
  }
  dishes.push(newData)
    console.log("NEW DATA",newData)
  res
  .status(201)
  .json({ data: newData })
}

function list(req, res){
  res.json({
    data: dishes
  })
}

function read(req, res){
  const dishId = req.params.dishId

  const matchingDish = dishes.find((dish) => dish.id === dishId)

  res.json({ data: res.locals.matchingDish })
}

//validation functions
function dishExists(req, res, next) {
    const { dishId } = req.params
   
    const matchingDish = dishes.find((dish) => dish.id === dishId)
    
    if (matchingDish) {
      res.locals.matchingDish = matchingDish
     
      return next()
    }
   
    next({
      status: 404,
      message: `Dish id not found: ${dishId}`,
    })
}

function bodyHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}

function bodyHasPrice(req, res, next){  
  
    const { data: { price } = {} } = req.body;
    if(price > 0 ){
      return next();
    }

    next({ 
      status:400, 
      message: "Dish must have a price that is an integer greater than 0"  
    });
}

function bodyHasValidPrice(req, res, next) {

  const { data: { price } = {} } = req.body

  if (price > -1) {
    res.locals.price = price
    return next()
  } else {

    next({
    status: 400,
    message: `price cannot be less than 0.`,
    })
  }
}

function dishIdMatchesDataId(req, res, next) {  
 
  const { data: { id } = {} } = req.body;
  const dishId = req.params.dishId

  if (id !== "" && id !== dishId && id !== null && id !== undefined) {
    next({
    status: 400,
    message: `id ${id} must match dataId provided in parameters`,
  })
  }

  return next();
}

function bodyHasValidPriceForUpdate(req, res, next) {
    
    const { data: { price } = {} } = req.body
   
    if (res.locals.price <= 0 || typeof res.locals.price !== "number") {
        next({
            status: 400,
            message: `price must be an integer greater than $0.`,
        })
    } else {
        
        return next()
    }
}
// -----------------------------------------------------//


module.exports = {
list,
read: [dishExists, read],
create: [
  bodyHas("name"),
  bodyHas("description"),
  bodyHas("image_url"),
  bodyHasPrice,
  create,
],
update: [
  dishExists,
  bodyHasValidPrice,
  dishIdMatchesDataId,
  bodyHas("name"),
  bodyHas("description"),
  bodyHas("image_url"),
  bodyHasPrice,
  bodyHasValidPriceForUpdate,
  update,
],
};