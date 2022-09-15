export const ServiceLink = (opts?: any): any => (
  (constructor: any) => (
    class extends constructor {
      constructor() {
        super(constructor.prototype.actions, opts.prefix);
      }
    }
  )
);
