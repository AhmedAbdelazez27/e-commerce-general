export class ApiEndpoints {
  static readonly Auth = {
    base: '/Customers',
    login: '/Login',
    register: '/Register',
    logout: '/Logout',
  };

  static readonly Catalog = {
    products: '/Products/GetList',
    productById: '/Products/GetById',
    categories: '/Categories/GetTree',
  };

  static readonly Cart = {
    get: '/Cart/Get',
    add: '/Cart/AddItem',
    update: '/Cart/UpdateItem',
    remove: '/Cart/RemoveItem',
  };

  static readonly Checkout = {
    placeOrder: '/Orders/PlaceOrder',
  };

  static readonly Account = {
    orders: '/Orders/GetMyOrders',
    profile: '/Customers/GetProfile',
  };

  /** Default route after successful customer login. */
  static readonly postLoginUrl = '/account/orders';
}
