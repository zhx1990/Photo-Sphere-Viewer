export const npmrc = () =>
    Promise.resolve(`
home=https://npmmirror.com
registry=https://packages.aliyun.com/60d1e8ad077c732675e5fbb8/npm/npm-registry/
//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}
//packages.aliyun.com/60d1e8ad077c732675e5fbb8/npm/npm-registry/:_authToken=332684b4-a8ae-40dc-bc6f-1f5600547f4d
always-auth=true
`);
