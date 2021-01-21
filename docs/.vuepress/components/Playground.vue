<style>
  .playground-container {
    margin: 0 calc(-50vw + 940px / 2);
    display: flex;
    align-items: flex-start;
  }

  #form {
    flex: none;
    width: 700px;
    margin-top: 0;
    margin-right: 10px;
  }

  #viewer {
    width: 100%;
    height: calc(100vh - 350px);
  }

  @media (max-width: 940px) {
    .playground-container {
      margin: 0;
    }
  }

  @media (max-width: 1600px) {
    .playground-container {
      display: block;
    }

    #form {
      width: 100%;
      margin-right: 0;
    }

    #viewer {
      margin-top: 10px;
      height: 600px;
    }
  }

  .playground-container .md-title {
    margin: 2em 0 0 0;
  }

  .playground-container .md-field,
  .playground-container .md-checkbox {
    margin-bottom: 0;
  }
</style>

<template>
  <div class="playground-container">
    <Tabs type="border-card" stretch id="form">
      <Tab label="Panorama">
        <div class="md-layout md-gutter">
          <md-button class="md-primary md-dense md-raised" style="margin: 15px 0 0 20px; width: 150px"
                     v-on:click="loadDefaultFile" target="_blank">
            Use demo file
          </md-button>
          <div class="md-layout-item">
            <md-field>
              <label>Panorama image</label>
              <md-file v-model="file" accept="image/*" v-on:md-change="loadFile"/>
            </md-field>
          </div>
        </div>

        <md-field md-clearable>
          <label>Caption</label>
          <md-input name="caption" v-model="options.caption" :disabled="!imageData"/>
        </md-field>
      </Tab>

      <Tab label="Standard options">
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Default longitude</label>
              <md-input v-model="options.defaultLong" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Default latitude</label>
              <md-input v-model="options.defaultLat" :disabled="!imageData"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Default zoom level</label>
              <md-input type="number" min="0" max="100" v-model="options.defaultZoomLvl" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Min FOV</label>
              <md-input type="number" min="1" max="179" v-model="options.minFov" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Max FOV</label>
              <md-input type="number" min="1" max="179" v-model="options.maxFov" :disabled="!imageData"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Autorotate speed</label>
              <md-input v-model="options.autorotateSpeed" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Autorotate latitude</label>
              <md-input v-model="options.autorotateLat" :disabled="!imageData"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.fisheye" :disabled="!imageData">Fisheye</md-checkbox>
          </div>
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.mousewheel" :disabled="!imageData">Mousewheel</md-checkbox>
          </div>
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.mousewheelCtrlKey" :disabled="!imageData">
              Hold Ctrl to zoom
            </md-checkbox>
          </div>
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.mousemove" :disabled="!imageData">Mouse move</md-checkbox>
          </div>
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.touchmoveTwoFingers" :disabled="!imageData">
              Two fingers move
            </md-checkbox>
          </div>
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.captureCursor" :disabled="!imageData">
              Capture cursor
            </md-checkbox>
          </div>
        </div>
      </Tab>

      <Tab label="Advanced options">
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Correction, pan</label>
              <md-input v-model="options.sphereCorrection.pan" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Correction, tilt</label>
              <md-input v-model="options.sphereCorrection.tilt" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Correction, roll</label>
              <md-input v-model="options.sphereCorrection.roll" :disabled="!imageData"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Mouse move speed</label>
              <md-input type="number" min="0" step="0.1" v-model="options.moveSpeed" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Mousewheel speed</label>
              <md-input type="number" min="0" step="0.1" v-model="options.mousewheelSpeed" :disabled="!imageData"/>
            </md-field>
          </div>
          <div class="md-layout-item md-size-33">
            <md-field>
              <label>Zoom buttons step</label>
              <md-input type="number" min="0" v-model="options.zoomButtonIncrement" :disabled="!imageData"/>
            </md-field>
          </div>
        </div>

        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33 checkbox-field">
            <md-checkbox class="md-primary" v-model="options.moveInertia" :disabled="!imageData">
              Move inertia
            </md-checkbox>
          </div>
        </div>
      </Tab>

      <Tab label="Navbar config">
        <div class="md-layout md-gutter">
          <div class="md-layout-item md-size-33" v-for="item in navbar">
            <md-checkbox class="md-primary" v-model="item.enabled" :disabled="!imageData">{{item.label}}</md-checkbox>
          </div>
        </div>
      </Tab>
    </Tabs>

    <div id="viewer"></div>
  </div>
</template>

<script>
  const { Viewer, DEFAULTS } = require('photo-sphere-viewer');
  const { cloneDeep, omit, debounce, isEqual } = require('lodash');

  export default {
    data: () => ({
      psv      : null,
      file     : null,
      imageData: null,
      options  : omit(cloneDeep(DEFAULTS), ['panorama', 'panoData', 'container', 'plugins', 'navbar', 'loadingImg']),
      navbar   : [
        { code: 'autorotate', label: DEFAULTS.lang.autorotate, enabled: true },
        { code: 'zoom', label: DEFAULTS.lang.zoom, enabled: true },
        { code: 'download', label: DEFAULTS.lang.download, enabled: true },
        { code: 'caption', label: 'Caption', enabled: true },
        { code: 'fullscreen', label: DEFAULTS.lang.fullscreen, enabled: true },
      ],
    }),

    beforeDestroy() {
      this.psv.destroy();
    },

    mounted() {
      this.oldOptions = cloneDeep(this.options);

      this.applyOptions = debounce(() => {
        try {
          if (this.options.defaultZoomLvl !== this.oldOptions.defaultZoomLvl) {
            this.psv.zoom(this.options.defaultZoomLvl);
          }
          else if (this.options.defaultLong !== this.oldOptions.defaultLong || this.options.defaultLat !== this.oldOptions.defaultLat) {
            this.psv.rotate({
              longitude: this.options.defaultLong,
              latitude : this.options.defaultLat,
            });
          }
          else {
            Object.keys(this.options).some(optName => {
              if (!isEqual(this.options[optName], this.oldOptions[optName])) {
                this.psv.setOption(optName, this.options[optName]);
                return true;
              }
            });
          }
        } catch (e) {
          // ignore parsing errors
        }
        this.oldOptions = cloneDeep(this.options);
      }, 200);

      this.psv = new Viewer({
        container : 'viewer',
        loadingImg: 'https://photo-sphere-viewer.js.org/assets/photosphere-logo.gif',
      });

      this.loadPsv();
    },

    watch: {
      options: {
        deep: true,
        handler() {
          this.applyOptions();
        },
      },
      navbar : {
        deep: true,
        handler() {
          this.psv.setOption('navbar', this.getNavbar());
        },
      },
    },

    methods: {
      loadFile(files) {
        if (files && files[0]) {
          const reader = new FileReader();

          reader.onload = (event) => {
            const image = new Image();

            image.onload = () => {
              this.imageData = image.src;
              this.loadPsv();
              this.options.caption = null;
            };

            image.src = event.target.result;
          };

          reader.readAsDataURL(files[0]);
        }
        else {
          this.imageData = null;
          this.loadPsv();
        }
      },

      loadDefaultFile() {
        this.imageData = 'https://photo-sphere-viewer.js.org/assets/sphere.jpg';
        this.file = null;
        this.loadPsv();
        this.options.caption = 'Parc national du Mercantour <b>&copy; Damien Sorel</b>';
      },

      loadPsv() {
        if (this.imageData) {
          this.psv.overlay.hide();

          this.psv.setPanorama(this.imageData);
        }
        else {
          this.psv.overlay.show({
            text       : 'Please select a panorama file',
            dissmisable: false,
          });
        }
      },

      getNavbar() {
        return this.navbar
          .filter(i => i.enabled)
          .map(i => i.code);
      },
    },
  }
</script>
