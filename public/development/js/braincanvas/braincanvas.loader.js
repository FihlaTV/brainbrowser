/*
 * Copyright (c) 2011-2012, McGill University
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 *   * Neither the name of McGill University nor the
 *     names of its contributors may be used to endorse or promote products
 *     derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL McGill University  BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
  "use strict";
    
  /**
  * Async load ArrayBuffer using XHR2
  * @param {String} url
  * @param {Function} callback
  */
  BrainCanvas.loader = {
    loadArrayBuffer: function(url, callback) {
      var request = new XMLHttpRequest();
      request.open('GET', url ,true);
      request.responseType = 'arraybuffer';
      request.onreadystatechange = function() {
        if(request.readyState === 4) {
          if(request.status === 200) {
            if(request.mozResponseArrayBuffer !== undefined) {
              callback(request.mozResponseArrayBuffer);
            } else {
              callback(request.response);
            }
          }
        }
      };
      request.send();
    },
    
    loadFromTextFile: function(file_input,callback) {
      var reader = new FileReader();
      var files = file_input.files;
      reader.file = files[0];
      
      reader.onloadend = function(e) {
        callback(e.target.result);
      };
      
      reader.readAsText(files[0]);
    },
  
    loadFromUrl: function(url,callback,error) {
      $.ajax({
        url: url,
        type: "GET",
        success: callback,
        error : error
      });
    },
    
    loadColorScaleFromFile: function(fileInput, name, callback) {
      BrainCanvas.loader.loadFromTextFile(fileInput, function(string) {
        var colorScale = new BrainCanvas.ColorScale(string);
        colorScale.name = name;
        callback(colorScale);
      });
    },

    loadColorScaleFromUrl: function(url, name, callback) {
      BrainCanvas.loader.loadFromUrl(url, function(string) {
        var colorScale = new BrainCanvas.ColorScale(string);
        colorScale.name = name;
        callback(colorScale);
      });
    }
  };
})();


