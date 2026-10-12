import { useState } from 'react';
import {
  Button,
  Card,
  Divider,
  FormField,
  Heading,
  Icon,
  InputEmail,
  InputNumber,
  InputPhoneNumber,
  InputText,
  Select,
  Text,
  toast,
} from '@/atlantis';
import { useNavigate } from 'react-router';
import { ROUTES } from '@app/routes';
import './CompanyProfilePage.css';

const industryOptions = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'general_contracting', label: 'General Contracting' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'cleaning', label: 'Cleaning' },
];

const measurementOptions = [
  { value: 'imperial', label: 'US (Imperial)' },
  { value: 'metric', label: 'Metric' },
];

const INITIAL_DATA = {
  companyName: 'ServiceFlex Pro',
  licenseNumber: '',
  websiteUrl: 'www.serviceflexpro.com',
  industry: 'plumbing',
  measurementSystem: 'imperial',
  companyEmail: 'info@serviceflexpro.com',
  phone: '(973) 896-0785',
  address: '123 Main Street, Newark, NJ 07102',
  currency: 'USD',
  taxPercentage: 8.5 as number | undefined,
  convenienceFee: 3 as number | undefined,
  logoUrl: '',
};

const paymentMethods = [
  { name: 'Visa', bg: '#1a1f71', text: 'white' },
  { name: 'MC', bg: '#eb001b', text: 'white' },
  { name: 'PayPal', bg: '#003087', text: 'white' },
  { name: 'Apple', bg: '#000000', text: 'white' },
  { name: 'GPay', bg: '#4285f4', text: 'white' },
  { name: 'Amex', bg: '#006fcf', text: 'white' },
];

export function CompanyProfilePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...INITIAL_DATA });
  const [savedData, setSavedData] = useState({ ...INITIAL_DATA });

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscard = () => {
    setFormData({ ...savedData });
  };

  const handleSave = () => {
    setSavedData({ ...formData });
    toast.success('Company profile saved');
  };

  return (
    <div className="company-profile-bg">
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-0">
        {/* Page Header */}
        <div className="flex items-center justify-center relative mb-6 sm:mb-8 px-10">
          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/80 transition-all duration-200 shadow-sm shrink-0"
            aria-label="Go back"
          >
            <Icon name="arrowLeft" size="base" />
          </button>
          <Heading level={2} className="text-gray-900 text-center break-words">Company Profile</Heading>
        </div>

        {/* Main Card */}
        <Card className="rounded-2xl border-0 shadow-lg overflow-hidden bg-white">
          <Card.Body>
            <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-8 lg:gap-10">
              {/* Section 1 - Company Profile */}
              <div className="company-profile-section">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Icon name="grid" size="base" color="blue" />
                  </div>
                  <Text size="large" className="text-gray-900 font-semibold break-words">
                    Company Profile
                  </Text>
                </div>

                {/* Logo + Fields row */}
                <div className="flex flex-col sm:flex-row gap-8">
                  {/* Logo area */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative group">
                      <div
                        className="w-28 h-28 rounded-xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: '#1f2d54' }}
                      >
                        <Icon name="building" size="large" color="white" />
                      </div>
                      {/* Green checkmark badge */}
                      <div className="absolute -top-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-md" style={{ borderWidth: '3px' }}>
                        <Icon name="checkmark" size="small" color="white" />
                      </div>
                    </div>
                    <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50">
                      <Icon name="edit" size="small" />
                      <span>Change Logo</span>
                    </button>
                  </div>

                  {/* Right fields */}
                  <div className="flex-1 flex flex-col gap-5">
                    <FormField label="Company Name" required>
                      <InputText
                        value={formData.companyName}
                        onChange={(v) => updateField('companyName', v)}
                        placeholder="Enter company name"
                        prefix="person"
                      />
                    </FormField>
                    <FormField label="License Number (Optional)">
                      <InputText
                        value={formData.licenseNumber}
                        onChange={(v) => updateField('licenseNumber', v)}
                        placeholder="Enter license number"
                        prefix="file"
                      />
                    </FormField>
                    <FormField label="Website URL">
                      <InputText
                        value={formData.websiteUrl}
                        onChange={(v) => updateField('websiteUrl', v)}
                        placeholder="www.example.com"
                        prefix="link"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Industry + Measurement row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
                  <FormField label="Industry">
                    <Select
                      value={formData.industry}
                      onChange={(v) => updateField('industry', String(v ?? ''))}
                      placeholder="Select industry..."
                      options={industryOptions}
                    />
                  </FormField>
                  <FormField label="Measurement System">
                    <Select
                      value={formData.measurementSystem}
                      onChange={(v) => updateField('measurementSystem', String(v ?? ''))}
                      placeholder="Select measurement..."
                      options={measurementOptions}
                    />
                  </FormField>
                </div>
              </div>

              <Divider className="my-2" />

              {/* Section 2 - Two column layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Contact Information */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon name="phone" size="base" color="blue" />
                    </div>
                    <Text size="large" className="text-gray-900 font-semibold break-words">
                      Contact Information
                    </Text>
                  </div>
                  <FormField label="Company Email">
                    <InputEmail
                      value={formData.companyEmail}
                      onChange={(v) => updateField('companyEmail', v)}
                      placeholder="name@example.com"
                    />
                  </FormField>
                  <FormField label="Phone Number">
                    <InputPhoneNumber
                      value={formData.phone}
                      onChange={(v) => updateField('phone', v)}
                      placeholder="(555) 555-5555"
                    />
                  </FormField>
                  <FormField label="Address">
                    <InputText
                      value={formData.address}
                      onChange={(v) => updateField('address', v)}
                      placeholder="Enter company address"
                      prefix="address"
                    />
                  </FormField>
                </div>

                {/* Right: Business & Financial */}
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon name="cog" size="base" color="blue" />
                    </div>
                    <Text size="large" className="text-gray-900 font-semibold break-words">
                      Business &amp; Financial
                    </Text>
                  </div>
                  <FormField label="Choose Currency">
                    <InputText
                      value={formData.currency}
                      onChange={(v) => updateField('currency', v)}
                      placeholder="USD"
                      prefix="money"
                    />
                  </FormField>
                  <FormField label="Tax Percentage (0 to 100)">
                    <InputNumber
                      value={formData.taxPercentage}
                      onChange={(v) => updateField('taxPercentage', v)}
                      placeholder="0"
                      min={0}
                      max={100}
                      suffixText="%"
                    />
                  </FormField>
                  <FormField label="Convenience Fee (0 to 100)">
                    <InputNumber
                      value={formData.convenienceFee}
                      onChange={(v) => updateField('convenienceFee', v)}
                      placeholder="0"
                      min={0}
                      max={100}
                      suffixText="%"
                    />
                  </FormField>
                </div>
              </div>

              <Divider className="my-2" />

              {/* Section 3 - Payment Setup */}
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Icon name="alert" size="base" color="orange" />
                  </div>
                  <Text size="large" className="text-gray-900 font-semibold break-words">
                    Payment Setup Required
                  </Text>
                </div>
                <Text size="base" variation="subdued" className="text-gray-700 mb-5">
                  Please finish your registration in order to accept online payments.
                </Text>

                {/* Payment methods row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                  <Text size="small" variation="subdued" className="text-gray-600 font-medium shrink-0">
                    Accepted payment methods:
                  </Text>
                  <div className="flex items-center gap-2 flex-wrap">
                    {paymentMethods.map((pm) => (
                      <span
                        key={pm.name}
                        className="inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-semibold leading-tight shadow-sm transition-transform hover:scale-105 whitespace-nowrap"
                        style={{
                          backgroundColor: pm.bg,
                          color: pm.text,
                        }}
                      >
                        {pm.name}
                      </span>
                    ))}
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors whitespace-nowrap">
                      +23 more...
                    </button>
                  </div>
                </div>

                {/* Setup button */}
                <div>
                  <Button
                    type="primary"
                    label="Complete Payment Setup"
                    fullWidth
                    onClick={() => {}}
                    className="!bg-[#1f2d54] hover:!bg-[#2a3a6a] !border-[#1f2d54] !text-white shadow-md transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
          <Button
            type="secondary"
            label="Discard Changes"
            fullWidth
            onClick={handleDiscard}
            className="!bg-white hover:!bg-gray-50 !border-gray-300 !text-gray-700 shadow-sm transition-all duration-200"
          />
          <Button
            type="primary"
            label="Save Changes"
            fullWidth
            onClick={handleSave}
            className="!bg-[#1f2d54] hover:!bg-[#2a3a6a] !border-[#1f2d54] !text-white shadow-md transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}
