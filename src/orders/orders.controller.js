const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// functions - list read create update delete 

function update(req, res){
    const orderId = req.params.orderId

    const foundOrder = orders.find((order) => order.id == orderId)
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body

    foundOrder.deliverTo = deliverTo
    foundOrder.mobileNumber = mobileNumber
    foundOrder.status = status
    foundOrder.dishes = dishes

    res.json({ data: foundOrder })
}

function create(req, res, next){
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
    
    const newOrder = {
      id: nextId(),
      deliverTo, 
      mobileNumber, 
      status, 
      dishes,
    }
    orders.push(newOrder)
    console.log("new order", newOrder)
    
    res
    .status(201)
    .json({ data: newOrder })

}

function list(req, res, next){
    res.json({
        data: orders
    })
}

function read(req, res){
  res.json({ data: res.locals.order });
}




function destroy(req, res){
    const order = res.locals.order;

    const index = orders.findIndex((ord) => ord.id === Number(order.id));
    
    orders.splice(index, 1);
    res.sendStatus(204);
} 


//validation functions


function orderExists(req, res, next) {
    const { orderId } = req.params;
   
    const matchingOrder = orders.find((order) => order.id === orderId)
    
    if (matchingOrder) {
      res.locals.order = matchingOrder
      return next()
    }
   
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    })
}

function bodyHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function orderIdMatchesDataId(req, res, next) {  
 
  const { data: { id } = {} } = req.body;
  const orderId = req.params.orderId

  if (id !== "" && id !== orderId && id !== null && id !== undefined) {
    next({
    status: 400,
    message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
  })
  }

  return next();
}


function statusIsValid(req, res, next){
  
  const { data: {status} = {} } = req.body
  
  if(status !== "pending" && status !== "preparing" && status !== "out-for-delivery" && status !== "delivered"){
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    })
  }
  
  return next();
}

function statusIsDelivered(req, res, next){
    
  const { data: {status} = {} } = req.body
  
  if(status === "delivered"){
    next({
      status: 400,
      message: "A delivered order cannot be changed",
    })
  }
  return next();
}

function dishesMissing(req, res, next){
  const {data: {dishes} = {} } = req.body
  
  if(Array.isArray(dishes) && dishes.length > 0){
    return next();
  }
  next({
    status: 400,
    message: "Order must include at least one dish",
  })  
}

function validQuantity(req, res, next){
  const {data: {dishes} = {} } = req.body  
  dishes.forEach((dish, index) => {
    if(!dish.quantity || !(Number(dish.quantity) > 0) || typeof dish.quantity !== "number"){
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      })
    }
  })
  next();
}

function isStatusPending(req, res, next) {
	const status = res.locals.order.status;
	if (status && status === "pending") {
		return next();
	}
	next({ status: 400, message: "An order cannot be deleted unless it is pending" });
}

module.exports = {
    read: [orderExists, read],
    create: [
        bodyHas("deliverTo"),
        bodyHas("mobileNumber"),
        bodyHas("dishes"),
        dishesMissing,
        validQuantity,
        create,
    ],
    update: [
        orderExists,
        orderIdMatchesDataId,
        bodyHas("deliverTo"),
        bodyHas("mobileNumber"),
        bodyHas("dishes"),
        statusIsValid,
        statusIsDelivered,
        dishesMissing,
        validQuantity,
        update,
    ],
     delete: [orderExists, isStatusPending, destroy], 
     list,
}