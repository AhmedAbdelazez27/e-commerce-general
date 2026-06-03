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
    productFilters: '/api/services/app/EcPublicCatalog/GetProductFilters',
    searchProducts: '/api/services/app/EcPublicCatalog/SearchProducts',
    productDetails: '/api/services/app/EcPublicCatalog/GetProductDetails',
    productVariants: '/api/services/app/EcPublicCatalog/GetProductVariants',
    productImages: '/api/services/app/EcPublicCatalog/GetProductImages',
    variantImages: '/api/services/app/EcPublicCatalog/GetVariantImages',
    productSpecifications: '/api/services/app/EcPublicCatalog/GetProductSpecifications',
    relatedProducts: '/api/services/app/EcPublicCatalog/GetRelatedProducts',
    finalPrice: '/api/services/app/EcPublicCatalog/GetFinalPrice',
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
