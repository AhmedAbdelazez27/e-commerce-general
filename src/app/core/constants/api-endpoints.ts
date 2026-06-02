export class ApiEndpoints {
  static readonly Auth = {
    authenticate: '/api/TokenAuth/Authenticate',
    registerECommerceCustomer: '/api/TokenAuth/RegisterECommerceCustomer',
    getECommerceCustomerProfile: '/api/TokenAuth/GetECommerceCustomerProfile',
  };

  static readonly Catalog = {
    products: '/Products/GetList',
    productById: '/Products/GetById',
    categories: '/Categories/GetTree',
  };

  static readonly EcPublicCatalog = {
    categoriesTree: '/api/services/app/EcPublicCatalog/GetCategoriesTree',
    brands: '/api/services/app/EcPublicCatalog/GetBrands',
  };

  static readonly EcCart = {
    mergeGuestCart: '/api/services/app/EcCart/MergeGuestCart',
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
    isTenantAvailable: '/api/services/app/Account/IsTenantAvailable',
    orders: '/Orders/GetMyOrders',
    profile: '/Customers/GetProfile',
  };

  /** Default route after successful customer login. */
  static readonly postLoginUrl = '/account/orders';
}
