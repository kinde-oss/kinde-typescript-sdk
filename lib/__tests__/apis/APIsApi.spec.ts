import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { APIsApi, type DeleteAPIRequest, type AddAPIsOperationRequest, type GetAPIRequest, type UpdateAPIApplicationsOperationRequest } from '../../apis/APIsApi'; 

describe('APIsApi', () => {
  const apiClient = new APIsApi(); 

  beforeEach(() => {
    vi.spyOn(apiClient.constructor.prototype, 'request').mockImplementation(
      async () => await Promise.resolve({ 
        status: 200,
        json: async () => await Promise.resolve({ status: 'API added' })
      })
    ); 
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('addAPIs makes a correct POST request', async () => {
    const addAPIsRequestData: AddAPIsOperationRequest = {
      addAPIsRequest: {
        audience: 'test',
        name: 'name'
      }
    };

    await apiClient.addAPIs(addAPIsRequestData);

    const requestSpy = vi.mocked(apiClient.constructor.prototype.request);
    expect(requestSpy).toHaveBeenCalledWith({
        path: '/api/v1/apis',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: addAPIsRequestData.addAPIsRequest,
        query: {}
    }, undefined);
  });

  it('deleteAPI makes a correct DELETE request correct Id', async () => {
    const deleteRequest: DeleteAPIRequest = {
      apiId: '123' 
    };

    await apiClient.deleteAPI(deleteRequest);

    const requestSpy = vi.mocked(apiClient.constructor.prototype.request);
    expect(requestSpy).toHaveBeenCalledWith({
        path: '/api/v1/apis/123',
        method: 'DELETE',
        headers: {},
        query: {}
    }, undefined);
  });

  it('getAPI makes a correct GET request with correct Id', async () => {
    const getRequest: GetAPIRequest = {
      apiId: '123' 
    };

    await apiClient.getAPI(getRequest);

    const requestSpy = vi.mocked(apiClient.constructor.prototype.request);
    expect(requestSpy).toHaveBeenCalledWith({
        path: '/api/v1/apis/123',
        method: 'GET',
        headers: {},
        query: {}
    }, undefined);
  });

  it('getAPIs makes a correct GET request', async () => {
    await apiClient.getAPIs();

    const requestSpy = vi.mocked(apiClient.constructor.prototype.request);
    expect(requestSpy).toHaveBeenCalledWith({
        path: '/api/v1/apis',
        method: 'GET',
        headers: {},
        query: {}
    }, undefined);
  });

  it('updateAPIApplications makes a correct PATCH request with correct Id', async () => {
    const patchReqest: UpdateAPIApplicationsOperationRequest = {
      apiId: '123',
      updateAPIApplicationsRequest: {
        applications: []
      }
    };


    await apiClient.updateAPIApplications(patchReqest);

    const requestSpy = vi.mocked(apiClient.constructor.prototype.request);
    expect(requestSpy).toHaveBeenCalledWith({
        path: '/api/v1/apis/123/applications',
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json'},
        body: patchReqest.updateAPIApplicationsRequest,
        query: {}
    }, undefined);
  });
});