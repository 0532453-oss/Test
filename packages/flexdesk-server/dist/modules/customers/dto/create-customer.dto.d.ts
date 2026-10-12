export declare class AddressDto {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    lat?: number;
    lng?: number;
}
export declare class CreateCustomerDto {
    name: string;
    email?: string;
    phone?: string;
    address?: AddressDto;
}
