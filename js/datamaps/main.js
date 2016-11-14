// README https://github.com/markmarkoh/datamaps/blob/master/README.md#getting-started

let commitsPop = {
  URY: {
          fillKey: 'L4',
          value: 5
      },
  ARG: {
          fillKey: 'L1',
          value: 1
      },
    BRA: {
          fillKey: 'L1',
          value: 1
      },
};

let commitsArea = {
  URY: {
          fillKey: 'L4',
          value: 5
      },
  ARG: {
          fillKey: 'L1',
          value: 1
      }
};

let devsPop = {
  URY: {
          fillKey: 'L1',
          value: 5
      },
  ARG: {
          fillKey: 'L1',
          value: 1
      },
};
let values = commitsPop;

var config = {
          element: document.getElementById('container'),
          fills: {
              L8: '#b10026',
              L7: '#e31a1c',
              L6: '#fc4e2a',
              L5: '#fd8d3c',
              L4: '#feb24c',
              L3: '#fed976',
              L2: '#ffeda0',
              L1: '#ffffcc',
              defaultFill: '#eaeaea'
          },
          data: values,
          geographyConfig: {
              hideAntarctica: true,
              borderWidth: 0.5,
              borderOpacity: 0.6,
              borderColor: '#575757',
              popupTemplate: function(geography, data) { // This function should just return a string
                let isoCode = geography.id;
                return `<div class="hoverinfo"> <h4>${geography.properties.name}</h4> ${values[isoCode]['value'].toFixed(2)} </div>`;
              },
              popupOnHover: true, // True to show the popup while hovering
              highlightFillColor: 'tomato',
          },
        }
let map = new Datamap(config);
