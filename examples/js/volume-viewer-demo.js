/*
* BrainBrowser: Web-based Neurological Visualization Tools
* (https://brainbrowser.cbrain.mcgill.ca)
*
* Copyright (C) 2011
* The Royal Institution for the Advancement of Learning
* McGill University
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
* Author: Tarek Sherif  <tsherif@gmail.com> (http://tareksherif.ca/)
* Author: Nicolas Kassis
*/

// This script is meant to be a demonstration of how to 
// use most of the functionality available in the 
// BrainBrowser Volume Viewer.
$(function() {
  "use strict";
  
  /////////////////////////////////////
  // Start running the Volume Viewer
  /////////////////////////////////////
  BrainBrowser.VolumeViewer.start("brainbrowser", function(viewer) {
    var loading_div = $("#loading");
  
    // Set up UI hooks once the viewer has been loaded.
    viewer.addEventListener("ready", function() {
      $(".button").button();

      // Should cursors in all panels be synchronized?
      $("#sync-volumes").change(function() {
        var synced = $(this).is(":checked");
        if (synced) {
          viewer.resetDisplays();
          viewer.redrawVolumes();
        }
        
        viewer.synced = synced;
      });

      // This will create an image of all the display panels
      // currently being shown in the viewer.
      $("#capture-slices").click(function() {
        var width = viewer.displays[0][0].canvas.width;
        var height = viewer.displays[0][0].canvas.height;
        var active_canvas = viewer.active_canvas;
        
        // Create a canvas on which we'll draw the images.
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var img = new Image();
        
        canvas.width = width * viewer.displays.length;
        canvas.height = height * 3;
        context.fillStyle = "#000000";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // The active canvas is highlighted by the viewer,
        // so we set it to null and redraw the highlighting
        // isn't shown in the image.
        viewer.active_canvas = null;
        viewer.draw();
        viewer.displays.forEach(function(display, x) {
          display.forEach(function(panel, y) {
            context.drawImage(panel.canvas, x * width, y * height);
          });
        });

        // Restore the active canvas.
        viewer.active_canvas = active_canvas;
        viewer.draw();
        
        // Show the created image in a dialog box.
        img.onload = function() {
          $("<div></div>").append(img).dialog({
            title: "Slices",
            height: img.height,
            width: img.width
          });
        };

        img.src = canvas.toDataURL();
      });

      // The world coordinate input fields.
      $(".world-coords").change(function() {
        var div = $(this);

        // Get the volume ID of the volume being displayed.
        var vol_id = div.data("volume-id");


        var x = parseFloat(div.find("#world-x-" + vol_id).val());
        var y = parseFloat(div.find("#world-y-" + vol_id).val());
        var z = parseFloat(div.find("#world-z-" + vol_id).val());
        
        // Make sure the values are numeric.
        if (!BrainBrowser.utils.isNumeric(x)) {
          x = 0;
        }
        if (!BrainBrowser.utils.isNumeric(y)) {
          y = 0;
        }
        if (!BrainBrowser.utils.isNumeric(z)) {
          z = 0;
        }

        // Set coordinates and redraw.
        viewer.volumes[vol_id].setWorldCoords(x, y, z);

        viewer.redrawVolumes();
      });

      // Change the color map currently being used to display data.
      $(".color-map-select").change(function(event) {
        var volume = viewer.volumes[$(this).data("volume-id")];
        volume.color_map = BrainBrowser.VolumeViewer.color_maps[+$(event.target).val()];
        viewer.redrawVolumes();
      });

      // Change the range of intensities that will be displayed.
      $(".threshold-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        // Input fields to input min and max thresholds directly.
        var min_input = div.find("#min-threshold-" + vol_id);
        var max_input = div.find("#max-threshold-" + vol_id);

        // Slider to modify min and max thresholds.
        var slider = div.find(".slider");

        slider.slider({
          range: true,
          min: 0,
          max: 255,
          values: [0, 255],
          step: 1,
          slide: function(event, ui){
            var values = ui.values;

            // Update the input fields.
            min_input.val(values[0]);
            max_input.val(values[1]);

            // Update the volume and redraw.
            volume.min = values[0];
            volume.max = values[1];
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });

        // Input field for minimum threshold.
        min_input.change(function() {
          var value = parseFloat(this.value);
          
          // Make sure input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }
          value = Math.max(0, Math.min(value, 255));
          this.value = value;

          // Update the slider.
          slider.slider("values", 0, value);

          // Update the volume and redraw.
          volume.min = value;
          viewer.redrawVolumes();
        });

        max_input.change(function() {
          var value = parseFloat(this.value);
          
          // Make sure input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 255;
          }
          value = Math.max(0, Math.min(value, 255));
          this.value = value;

          // Update the slider.
          slider.slider("values", 1, value);
          
          // Update the volume and redraw.
          volume.max = value;
          viewer.redrawVolumes();
        });

      });

      $(".time-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        if (volume.data.time) {
          div.show();
        } else {
          return;
        }
        
        var slider = div.find(".slider");
        var time_input = div.find("#time-val-" + vol_id);
        var play_button = div.find("#play-" + vol_id);

        var min = 0;
        var max = volume.data.time.space_length - 1;
        var play_interval;
      
        slider.slider({
          min: min,
          max: max,
          value: 0,
          step: 1,
          slide: function(event, ui) {
            var value = +ui.value;
            time_input.val(value);
            volume.current_time = value;
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });
        
        time_input.change(function() {
          var value = parseInt(this.value, 10);
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }

          value = Math.max(min, Math.min(value, max));

          this.value = value;
          time_input.val(value);
          slider.slider("value", value);
          volume.current_time = value;
          viewer.redrawVolumes();
        });
        
        play_button.change(function() {
          if(play_button.is(":checked")){
            clearInterval(play_interval);
            play_interval = setInterval(function() {
              var value = volume.current_time + 1;
              value = value > max ? 0 : value;
              volume.current_time = value;
              time_input.val(value);
              slider.slider("value", value);
              viewer.redrawVolumes();
            }, 200);
          } else {
            clearInterval(play_interval);
          }
        });

      });

      // Create an image of all slices in a certain
      // orientation.
      $(".slice-series-div").each(function() {
        var div = $(this);
        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        var space_names = {
          xspace: "Sagittal",
          yspace: "Coronal",
          zspace: "Transverse"
        };

        div.find(".slice-series-button").click(function() {
          var axis_name = $(this).data("axis");
          var axis = volume.data[axis_name];
          var space_length = axis.space_length;
          var time = volume.current_time;
          var per_column = 10;
          var zoom = 0.5;
          var i, x, y;

          // Canvas on which to draw the images.
          var canvas = document.createElement("canvas");
          var context = canvas.getContext("2d");

          // Get first slice to set dimensions of the canvas.
          var image_data = volume.slice(axis_name, 0, time).getImage(zoom);
          var img = new Image();
          canvas.width = per_column * image_data.width;
          canvas.height = Math.ceil(space_length / per_column) * image_data.height;
          context.fillStyle = "#000000";
          context.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the slice on the canvas.
          context.putImageData(image_data, 0, 0);

          // Draw the rest of the slices on the canvas.
          for (i = 1; i < space_length; i++) {
            image_data = volume.slice(axis_name, i, time).getImage(zoom);
            x = i % per_column * image_data.width;
            y = Math.floor(i / per_column) * image_data.height;
            context.putImageData(image_data, x, y);
          }

          // Retrieve image from canvas and display it 
          // in a dialog box.
          img.onload = function() {
            $("<div></div>").append(img).dialog({
              title: space_names[axis_name] + " Slices",
              height: 600,
              width: img.width
            });
          };
          
          img.src = canvas.toDataURL();
        });
      });

      // Blend controls for a multivolume overlay.
      $(".blend-div").each(function() {
        var div = $(this);
        var slider = div.find(".slider");
        var blend_input = div.find("#blend-val");

        var vol_id = div.data("volume-id");
        var volume = viewer.volumes[vol_id];

        // Slider to select blend value.
        slider.slider({
          min: 0,
          max: 1,
          step: 0.01,
          value: 0.5,
          slide: function(event, ui) {
            var value = parseFloat(ui.value);
            volume.blend_ratios[0] = 1 - value;
            volume.blend_ratios[1] = value;
            


            blend_input.val(value);
            viewer.redrawVolumes();
          },
          stop: function() {
            $(this).find("a").blur();
          }
        });
        
        // Input field to select blend values explicitly.
        blend_input.change(function() {
          var value = parseFloat(this.value);
          
          // Check that input is numeric and in range.
          if (!BrainBrowser.utils.isNumeric(value)) {
            value = 0;
          }
          value = Math.max(0, Math.min(value, 1));
          this.value = value;

          // Update slider and redraw volumes.
          slider.slider("value", value);
          volume.blend_ratios[0] = 1 - value;
          volume.blend_ratios[1] = value;
          viewer.redrawVolumes();
        });
      });


      loading_div.hide();
      $("#brainbrowser-wrapper").slideDown({duration: 600});
    });

    // Update coordinate display as slices are updated
    // by the user.
    viewer.addEventListener("sliceupdate", function() {
      viewer.volumes.forEach(function(volume, vol_id) {
        var world_coords = volume.getWorldCoords();
        var voxel_coords = volume.getVoxelCoords();
        $("#world-x-" + vol_id).val(world_coords.x.toPrecision(6));
        $("#world-y-" + vol_id).val(world_coords.y.toPrecision(6));
        $("#world-z-" + vol_id).val(world_coords.z.toPrecision(6));

        $("#voxel-x-" + vol_id).val(voxel_coords.x.toPrecision(6));
        $("#voxel-y-" + vol_id).val(voxel_coords.y.toPrecision(6));
        $("#voxel-z-" + vol_id).val(voxel_coords.z.toPrecision(6));
      });
    });

    loading_div.show();

    // Load the volumes.
    viewer.loadVolumes({
      volumes: [
        {
          type: "minc",
          header_url: "models/structural1.mnc.headers",
          raw_data_url: "models/structural1.mnc.raw",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        },
        {
          type: 'minc',
          header_url: "models/structural2.mnc.headers",
          raw_data_url: "models/structural2.mnc.raw",
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        }
      ],
      overlay: {
        template: {
          element_id: "overlay-ui-template",
          viewer_insert_class: "overlay-viewer-display"
        }
      },
      panel_width: 256,
      panel_height: 256
    });

  });

});
