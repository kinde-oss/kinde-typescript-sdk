export enum PortalPage {
  organizationDetails = 'organization_details',
  organizationMembers = 'organization_members',
  organizationPlanDetails = 'organization_plan_details',
  organizationPaymentDetails = 'organization_payment_details',
  organizationPlanSelection = 'organization_plan_selection',
  paymentDetails = 'payment_details',
  planSelection = 'plan_selection',
  planDetails = 'plan_details',
}

export interface GeneratePortalUrlParams {
  domain?: string;
  returnUrl: string;
  subNav?: PortalPage;
}
