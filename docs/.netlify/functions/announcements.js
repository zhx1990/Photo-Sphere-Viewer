const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  return await axios({
    url    : 'https://api.github.com/graphql',
    method : 'POST',
    headers: {
      'Authorization': `bearer ${process.env.GH_TOKEN}`,
    },
    data   : {
      query: `
        query {
          repository(owner: "mistic100", name: "photo-sphere-viewer") {
            pinnedDiscussions(first: 2) {
              nodes {
                discussion {
                  title
                  createdAt
                  url
                  body
                }
              }
            }
          }
        }`,
    },
  })
    .then(result => {
        const announcements = result.data.data.repository.pinnedDiscussions.nodes.map(n => n.discussion);
        return {
          statusCode: 200,
          body: JSON.stringify(announcements)
        };
    });
};
