import { apiFetch } from './api-client';
import type { UserProfile } from './auth.apis';

export interface AvatarUploadResponse {
  objectKey: string;
  uploadUrl: string;
  bucket: string;
}

export interface UpdateMePayload {
  name?: string;
  email?: string;
}

export const usersApi = {
  async getAvatarUploadUrl(extension: string): Promise<AvatarUploadResponse> {
    return apiFetch<AvatarUploadResponse>('/users/me/avatar/upload-url', {
      method: 'POST',
      body: { extension },
    });
  },

  async confirmAvatar(objectKey: string): Promise<UserProfile> {
    return apiFetch<UserProfile>('/users/me/avatar/confirm', {
      method: 'POST',
      body: { objectKey },
    });
  },

  async updateMe(payload: UpdateMePayload): Promise<UserProfile> {
    return apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: payload,
    });
  },
};
