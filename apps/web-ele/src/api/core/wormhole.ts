import { requestClient } from '#/api/request';

export async function addWormholeApi(params: any) {
  return requestClient.post('/wormhole/add', params);
}

export async function listWormholeUserApi() {
  return requestClient.get('/wormhole/listuser');
}
