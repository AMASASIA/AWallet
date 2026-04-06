import { ConsentPayload, ConsentResponse } from '../types';

export const verifyConsent = async (payload: ConsentPayload): Promise<ConsentResponse> => {
    return new Promise((resolve) => {
        // Mock backend verification delay
        setTimeout(() => {
            resolve({
                success: true,
                message: "Consent Proof Recorded on Soul SBT",
                audit_id: "aud_" + Math.random().toString(36).substring(7)
            });
        }, 1500);
    });
};
