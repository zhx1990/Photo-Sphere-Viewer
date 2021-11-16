<template>
  <div class="announcements">
    <div class="custom-block tip" v-for="entry in announcements">
      <p class="custom-block-title"><Badge text="NEW"/> {{entry.title}}
        <small>{{entry.date}}</small>
      </p>
      <p v-html="entry.body"></p>
    </div>
  </div>
</template>

<script>
  const axios = require('axios');
  const { marked } = require('marked');
  const { format, parseISO } = require('date-fns');

  export default {
    data() {
      return {
        announcements: [],
      };
    },
    mounted() {
      this.fetchAnnouncements()
        .then(announcements => {
          this.announcements = announcements.data.map(this.formatAnnouncement);
        });
    },
    methods: {
      fetchAnnouncements() {
        const cacheDate = localStorage.announcementsCacheDate;

        if (cacheDate && (new Date() - new Date(cacheDate)) < 1000 * 3600) {
          return Promise.resolve(JSON.parse(localStorage.announcementsCache));
        } else {
          return axios('/.netlify/functions/announcements')
            .then(function (data) {
              localStorage.announcementsCacheDate = new Date().toString();
              localStorage.announcementsCache = JSON.stringify(data);
              return data;
            });
        }
      },
      formatAnnouncement(announcement) {
        let body = marked.parseInline(announcement.body.split('\r\n')[0], { breaks: true });
        body += ` <a href="${announcement.url}">Read more.</a>`;

        return {
          title: announcement.title,
          url  : announcement.url,
          date : format(parseISO(announcement.createdAt), 'PPP'),
          body : body,
        };
      }
    }
  }
</script>

<style>
.announcements {
  display: flex;
  flex-wrap: wrap;
}

.announcements > div {
  flex: 1;
  min-width: 300px;
}
</style>
