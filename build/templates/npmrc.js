export const npmrc = () =>
    Promise.resolve(`@photo-sphere-viewer:registry=https://registry.npmjs.org
//registry.npmjs.org/:_authToken=\${NODE_AUTH_TOKEN}
`);
