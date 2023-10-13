<template>
    <ExternalLink :href="href" style="float: right">
        API Documentation
    </ExternalLink>
</template>

<script>
export default {
    props: ['page'],
    data() {
        return {
            href: `/api/${this.page}`,
        };
    },
};
</script>
