export interface UserPayload {
    sub: string;
    email: string;
    role: 'user' | 'admin'; // Add more roles as needed
    iat?: number;
    exp?: number;
}