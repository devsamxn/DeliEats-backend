import { Request, Response } from "express";
import Restaurant, { MenuItemType } from "../models/restaurant";
import Order from "../models/order";
type CheckoutSessionRequest = {
  cartItems: {
    menuItemId: string;
    name: string;
    quantity: number;
  }[];
  deliveryDetails: {
    email: string;
    name: string;
    addressLine1: string;
    city: string;
  };
  restaurantId: string;
};

const getMyOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("restaurant")
      .populate("user");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
};

const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const checkoutSessionRequest: CheckoutSessionRequest = req.body;
    const restaurant = await Restaurant.findById(
      checkoutSessionRequest.restaurantId
    );
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    let totalAmount = 0;
    checkoutSessionRequest.cartItems.forEach((cartItem) => {
      const menuItem = restaurant.menuItems.find(
        (item: MenuItemType) => String(item._id) === cartItem.menuItemId
      );
      if (!menuItem) return;
      const total = menuItem.price * cartItem.quantity;
      totalAmount += total;
    });

    const newOrder = new Order({
      restaurant: restaurant, //this joins the restaurant with the new order
      user: req.userId,
      status: "placed",
      deliveryDetails: checkoutSessionRequest.deliveryDetails,
      cartItems: checkoutSessionRequest.cartItems,
      createdAt: new Date(),
      totalAmount: totalAmount,
    });

    await newOrder.save();
    res.json({ message: "order created successfully" });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong with the payment" });
  }
};

export default { createCheckoutSession, getMyOrders };
