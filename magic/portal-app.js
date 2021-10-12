
jQuery(document).ready(function() {

  window.new_inc = 0

  if ( '' === jsObject.parts.action || 'groups' === jsObject.parts.action ) {
    window.load_tree()
    if ( ! Cookies.get('portal_app_groups_intro') ) {
      window.intro_home()
    }
  }

});

window.post_item = ( action, data ) => {
  return jQuery.ajax({
    type: "POST",
    data: JSON.stringify({ action: action, parts: jsObject.parts, data: data }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: jsObject.root + jsObject.parts.root + '/v1/' + jsObject.parts.type + '_update',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('X-WP-Nonce', jsObject.nonce )
    }
  })
    .fail(function(e) {
      console.log(e)
      jQuery('#error').html(e)
      jQuery('.loading-spinner').removeClass('active')
    })
}

window.load_tree = () => {
  jQuery.ajax({
    type: "GET",
    data: { action: 'get', parts: jsObject.parts },
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    url: jsObject.root + jsObject.parts.root + '/v1/' + jsObject.parts.type,
    beforeSend: function (xhr) {
      xhr.setRequestHeader('X-WP-Nonce', jsObject.nonce )
    }
  })
    .done(function(data){
      console.log(data)

      window.load_domenu(data)

      jQuery('.loading-spinner').removeClass('active')
      jQuery('#initial-loading-spinner').hide()
    })
    .fail(function(e) {
      console.log(e)
      jQuery('#error').html(e)
      jQuery('.loading-spinner').removeClass('active')
    })
}

window.load_domenu = ( data ) => {

  jQuery('#domenu-0').domenu({
    data: JSON.stringify( data.tree ),
    maxDepth: 500,
    refuseConfirmDelay: 500, // does not delete immediately but requires a second click to confirm.
    select2:                {
      support:     false, // Enable Select2 support
    }
  }).parseJson()

    .onCreateItem(function(e) {
      console.log('onCreateItem')

      window.new_inc++

      window.new_item = {
        inc: window.new_inc,
        temp_id: 'new_id_'+window.new_inc,
        parent_id: 'domenu-0'
      }

      e.attr('id', 'new_id_'+window.new_inc )
    })
    .onItemAddChildItem(function(e) {
      console.log('onItemAddChildItem')
      console.log( e[0].id )
      window.new_item.parent_id = e[0].id
    })
    .onItemRemoved(function(e) {
      if ( window.last_removed !== e[0].id ) {
        console.log('onItemRemoved')
        jQuery('.loading-spinner').addClass('active')

        window.last_removed = e[0].id

        window.post_item('onItemRemoved', { id: e[0].id} ).done(function(remove_data){
          if ( remove_data ) {
            console.log('success onItemRemoved')
          }
          else {
            console.log('did not remove item')
          }
          jQuery('.loading-spinner').removeClass('active')
        })
      }
    })
    .onItemDrop(function(e) {
      if ( typeof e.prevObject !== 'undefined' && typeof e[0].id !== 'undefined' ) { // runs twice on drop. with and without prevObject
        console.log('onItemDrop')
        jQuery('.loading-spinner').addClass('active')

        let new_parent = e[0].parentNode.parentNode.id
        let self = e[0].id

        console.log(' - new parent: '+ new_parent)
        console.log(' - self: '+ self)

        let prev_parent_object = jQuery('#'+e[0].id)
        let previous_parent = prev_parent_object.data('prev_parent')
        console.log(' - previous parent: ' + previous_parent )

        prev_parent_object.attr('data-prev_parent', new_parent ) // set previous

        if ( new_parent !== previous_parent ) {
          window.post_item('onItemDrop', { new_parent: new_parent, self: self, previous_parent: previous_parent } ).done(function(drop_data){
            jQuery('.loading-spinner').removeClass('active')
            if ( drop_data ) {
              console.log('success onItemDrop')
            }
            else {
              console.log('did not edit item')
            }
          })
        }

      }
    })
    .onItemSetParent(function(e) {
      if (typeof e[0] !== 'undefined' ) {
        console.log('onItemSetParent')
        console.log(' - has children: ' + e[0].id)
        jQuery('#' + e[0].id + ' button.item-remove:first').hide();
      }
    })
    .onItemUnsetParent(function(e) {
      if (typeof e[0] !== 'undefined' ) {
        console.log('onItemUnsetParent')
        console.log(' - has no children: '+ e[0].id)
        jQuery('#' + e[0].id + ' button.item-remove:first').show();
      }
    })


  // list prep
  jQuery.each( jQuery('#domenu-0 .item-name'), function(i,v){
    // move and set the title to id
    jQuery(this).parent().parent().attr('id', jQuery(this).html())
  })
  // set the previous parent data element
  jQuery.each( data.parent_list, function(ii,vv) {
    if ( vv !== null && vv !== "undefined") {
      let target = jQuery('#'+ii)
      if ( target.length > 0 ) {
        target.attr('data-prev_parent', vv )
      }
    }
  })
  // show delete for last item
  jQuery("li:not(:has(>ol)) .item-remove").show()
  // set title
  jQuery.each(jQuery('.item-name'), function(ix,vx) {
    let old_title = jQuery(this).html()
    jQuery(this).html(data.title_list[old_title])
  })
  // add listener to top add item box
  jQuery('.dd-new-item').on('click', function() {
    window.create_group()
  })
  // set listener for add submenu items
  jQuery('#domenu-0 .item-add').on('click', function(e) {
    window.create_group()
  })
  // set listener for edit button
  jQuery('#domenu-0 .item-edit').on('click', function(e) {
    window.open_modal(e.currentTarget.parentNode.parentNode.parentNode.id)
  })
}

window.create_group = () => {
  console.log('create_group')
  jQuery('.loading-spinner').addClass('active')
  window.open_empty_modal()

  console.log( window.new_item )

  window.post_item('create_group', window.new_item )
    .done(function(response){
      console.log(response)
      if ( response ) {

        jQuery('#'+ response.temp_id).attr('id', response.id )
        jQuery('#'+response.id).attr('data-prev_parent', response.prev_parent )
        jQuery('#'+response.id + ' .item-name:first').html( response.title )
        jQuery('#'+response.id + ' .item-add:first').on('click', function(e) {
          window.create_group()
        })
        jQuery('#'+response.id + ' .item-edit:first').on('click', function(e) {
          window.open_modal(response.id )
        })

        response.post.title = ""

        window.load_modal_content( response.post, response.post_fields )

      } else {
        console.log(response)
      }

    })
}

window.create_group_by_map = ( ) => {
  console.log('create_group')
  jQuery('.loading-spinner').addClass('active')
  window.open_empty_modal()

  let title = jQuery('#report-modal-title').val()
  let grid_id = jQuery('#report-grid-id').val()

  window.new_inc++

  window.new_item = {
    inc:  window.new_inc,
    grid_id: grid_id,
    title: title
  }

  window.post_item('create_group_by_map', { inc:  window.new_inc, grid_id: grid_id, title: title } )
    .done(function(response){
      console.log(response)
      if ( response ) {

        // reload mapdata when new church is added
        window.get_grid_data( 'grid_data', 0)
          .done(function(x){
            console.log('updated grid_data')
            jsObject.grid_data = x
          })

        response.post.title = ""
        window.load_modal_content( response.post, response.post_fields )

      } else {
        console.log(response)
      }

    })
}
window.open_empty_modal= () => {
  let title = jQuery('#modal-title')
  let content = jQuery('#modal-content')

  title.empty().html(`<span class="loading-spinner active"></span>`)
  content.empty()
  jQuery('#edit-modal').foundation('open')
}

window.open_modal = ( id ) => {
  let title = jQuery('#modal-title')
  let content = jQuery('#modal-content')

  title.empty().html(`<span class="loading-spinner active"></span>`)
  content.empty()

  jQuery('#edit-modal').foundation('open')

  window.post_item('get_group', { id: id } )
    .done(function(response){
      console.log(response)
      if ( typeof response.errors === 'undefined' ) {
        window.load_modal_content( response.post, response.post_fields )
      } else {
        console.log(response)
        jQuery('.loading-spinner').removeClass('active')
      }
    })
}

window.load_modal_content = ( post, post_fields ) => {
  let member_count = 0
  if ( typeof post.member_count !== 'undefined' ) {
    member_count = post.member_count
  }

  let type_select
  let selected = 'church'
  if ( typeof post.group_type !== "undefined" ) {
    selected = post.group_type.key
  }
  jQuery.each( post_fields.group_type.default, function( i, v ) {
    let preselect = ''
    if ( i === selected ) {
      preselect = ' selected'
    }
    type_select += '<option value="'+i+'" '+preselect+'>'+v.label+'</option>'
  })

  let status_select
  let status_selected = 'active'
  if ( typeof post.group_status !== "undefined" ) {
    status_selected = post.group_status.key
  }
  jQuery.each( post_fields.group_status.default, function( i, v ) {
    let preselect_s = ''
    if ( i === status_selected ) {
      preselect_s = ' selected'
    }
    status_select += '<option value="'+i+'" '+preselect_s+'>'+v.label+'</option>'
  })

  // template
  jQuery('#modal-title').html('<h1>Edit Church</h1><hr>')
  jQuery('#modal-content').append(`
          <div class="grid-x">

            <!-- title -->
            <div class="cell">
              Name<br>
              <div class="input-group">
                <input type="text" style="border:0; border-bottom: 1px solid darkgrey;font-size:1.5rem;line-height: 2rem;" id="group_title" placeholder="${post.name}" value="${post.title}" />
                <div class="input-group-button">
                     <div><span class="loading-field-spinner group_title"></span></div>
                </div>
              </div>
            </div>

            <!-- start date -->
            <div class="cell">
              Start Date<br>
              <div class="input-group">
                <input type="date" style="border:0; border-bottom: 1px solid darkgrey;font-size:1.5rem;line-height: 2rem;" id="group_start_date" value="${post.church_start_date.formatted}" />
                <div class="input-group-button">
                     <div><span class="loading-field-spinner group_start_date"></span></div>
                </div>
              </div>
            </div>

            <!-- members -->
            <div class="cell">
              Number of Members<br>
              <div class="input-group">
                <input type="number" style="border:0; border-bottom: 1px solid darkgrey;font-size:1.5rem;line-height: 2rem;" id="group_member_count" value="${member_count}" />
                <div class="input-group-button">
                     <div><span class="loading-field-spinner group_member_count"></span></div>
                </div>
              </div>
            </div>

            <!-- location -->
            <div class="cell" id="mapbox-select">
              Location<br>
              <div id="map-wrapper-edit">
                  <div id='map-edit'></div>
              </div>
              <br>
              <button type="button" onclick="remove_location(${post.ID})" style="display:none;" class="button primary-button-hollow remove-location">Remove Location</button>
              <span class="loading-field-spinner group_location"></span>
            </div>

            <!-- status -->
            <div class="cell">
              Status<br>
              <div class="input-group">
                <select id="group_status">
                  ${status_select}
                </select>
                <div class="input-group-button">
                     <div><span class="loading-field-spinner group_status"></span></div>
                </div>
              </div>
            </div>
          </div>
        `)

  // listeners
  jQuery('#group_title').on('change', function(e){
    jQuery('.loading-field-spinner.group_title').addClass('active')
    window.post_item('update_group_title', { post_id: post.ID, new_value: e.target.value } )
      .done(function(result) {
        console.log(result)
        if ( typeof result.errors === 'undefined') {
          jQuery('#group_title').attr('value', result.name)
          jQuery('#'+post.ID + ' .item-name:first').html(result.name)
        }
        else {
          console.log(result)
        }
        jQuery('.loading-field-spinner.group_title').removeClass('active')
      })
  })
  jQuery('#group_member_count').on('change', function(e){
    jQuery('.loading-field-spinner.group_member_count').addClass('active')
    window.post_item('update_group_member_count', { post_id: post.ID, new_value: e.target.value } )
      .done(function(result) {
        console.log(result)
        if ( typeof result.errors === 'undefined') {
          jQuery('#group_member_count').attr('value', result.member_count)
        }
        else {
          console.log(result)
        }
        jQuery('.loading-field-spinner.group_member_count').removeClass('active')
      })
  })
  jQuery('#group_start_date').on('change', function(e){
    jQuery('.loading-field-spinner.group_start_date').addClass('active')
    window.post_item('update_group_start_date', { post_id: post.ID, new_value: e.target.value } )
      .done(function(result) {
        console.log(result)
        if ( typeof result.errors !== 'undefined') {
          console.log(result)
        }
        jQuery('.loading-field-spinner.group_start_date').removeClass('active')
      })
  })
  jQuery('#group_status').on('change', function(e){
    jQuery('.loading-field-spinner.group_status').addClass('active')
    window.post_item('update_group_status', { post_id: post.ID, new_value: e.target.value } )
      .done(function(result) {
        console.log(result)
        if ( typeof result.errors !== 'undefined') {
          console.log(result)
        }
        jQuery('.loading-field-spinner.group_status').removeClass('active')
      })
  })
  jQuery(window).on(
    'closed.zf.reveal', function () {
      if ( 'map' === jsObject.parts.action ) {
        load_map()
        jQuery('#offCanvasNestedPush').foundation('close')
      }
    }
  );

  // if on map page, do not show map selection section
  if ( 'map' !== jsObject.parts.action ) {
    let lng,lat
    if( post.location_grid_meta ) {
      lng = post.location_grid_meta[0].lng
      lat = post.location_grid_meta[0].lat
    }
    load_mapbox(lng, lat, post.ID )
  } else {
    jQuery('#mapbox-select').hide()
  }

  jQuery('.loading-spinner').removeClass('active')
}

window.load_mapbox = (lng,lat, post_id ) => {

  let center, zoom
  if ( lng ) {
    center = [lng, lat]
  } else {
    center = [-20, 30]
  }

  /***********************************
   * Map
   ***********************************/
  mapboxgl.accessToken = jsObject.map_key;
  var map = new mapboxgl.Map({
    container: 'map-edit',
    style: 'mapbox://styles/mapbox/light-v10',
    center: center,
    zoom: 1
  });

  window.force_values = false
  if ( lng ) {
    let marker_center = new mapboxgl.LngLat(lng, lat)
    window.active_marker = new mapboxgl.Marker()
      .setLngLat(marker_center)
      .addTo(map);
    map.flyTo({
      center: center,
      zoom: 12,
      bearing: 0,
      speed: 2, // make the flying slow
      curve: 1, // change the speed at which it zooms out
      easing: (t) => t,
      essential: true
    });
    window.force_values = true // wipe out previous location data on the record
    jQuery('.remove-location').show() // show the removal button
  }


  /***********************************
   * Click
   ***********************************/
  map.on('click', function (e) {
    console.log(e)

    let lng = e.lngLat.lng
    let lat = e.lngLat.lat
    window.active_lnglat = [lng,lat]

    // add marker
    if ( window.active_marker ) {
      window.active_marker.remove()
    }
    window.active_marker = new mapboxgl.Marker()
      .setLngLat(e.lngLat )
      .addTo(map);

    jQuery('#result_display').html(`Save Clicked Location`)
    jQuery('.remove-location').hide()

    window.location_data = {
      location_grid_meta: {
        values: [
          {
            lng: lng,
            lat: lat,
            source: 'user'
          }
        ],
        force_values: window.force_values
      }
    }

    save_new_location( post_id )

  });

  /***********************************
   * Search
   ***********************************/
  var geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    types: 'country region district locality neighborhood address place',
    mapboxgl: mapboxgl
  });
  map.addControl(geocoder);
  geocoder.on('result', function(e) { // respond to search
    console.log(e)
    if ( window.active_marker ) {
      window.active_marker.remove()
    }
    window.active_marker = new mapboxgl.Marker()
      .setLngLat(e.result.center)
      .addTo(map);
    geocoder._removeMarker()

    jQuery('#result_display').html(`Save Searched Location`)
    jQuery('.remove-location').hide()

    window.location_data = {
      location_grid_meta: {
        values: [
          {
            lng: e.result.center[0],
            lat: e.result.center[1],
            level: e.result.place_type[0],
            label: e.result.place_name,
            source: 'user'
          }
        ],
        force_values: window.force_values
      }
    }

    save_new_location( post_id )
  })

  /***********************************
   * Geolocate Browser
   ***********************************/
  let userGeocode = new mapboxgl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: true
    },
    marker: {
      color: 'orange'
    },
    trackUserLocation: false,
    showUserLocation: false
  })
  map.addControl(userGeocode);
  userGeocode.on('geolocate', function(e) { // respond to search
    console.log(e)
    if ( window.active_marker ) {
      window.active_marker.remove()
    }

    let lat = e.coords.latitude
    let lng = e.coords.longitude

    window.active_lnglat = [lng,lat]
    window.active_marker = new mapboxgl.Marker()
      .setLngLat([lng,lat])
      .addTo(map);

    jQuery('#result_display').html(`Save Current Location`)
    jQuery('.remove-location').hide()

    window.location_data = {
      location_grid_meta: {
        values: [
          {
            lng: lng,
            lat: lat,
            source: 'user'
          }
        ],
        force_values: window.force_values
      }
    }

    save_new_location( post_id )
  })

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.addControl(new mapboxgl.NavigationControl());

}

function activate_geolocation() {
  jQuery(".mapboxgl-ctrl-geolocate").click();
}

function save_new_location( id ) {
  if ( typeof window.location_data === undefined || window.location_data === false ) {
    jQuery('#result_display').html(`You haven't selected anything yet. Click, search, or allow auto location.`)
    return;
  }
  jQuery('.loading-field-spinner.group_location').addClass('active')

  console.log(window.location_data)

  window.post_item('update_group_location', { post_id: id, location_data: window.location_data, delete: window.force_values } )
    .done(function(result) {
      console.log(result)
      jQuery('.remove-location').show();
      jQuery('.loading-field-spinner.group_location').removeClass('active')
      window.force_values = true

      // reload flat map
      if ( jsObject.parts.action === 'map' ) {
        window.get_grid_data( 'grid_data', 0)
          .done(function(x){
            jsObject.grid_data = x
          })
      }
    })
}

function remove_location( id ) {
  jQuery('.loading-field-spinner.group_location').addClass('active')
  window.post_item('delete_group_location', { post_id: id } )
    .done(function(result) {
      console.log(result)
      jQuery('.remove-location').hide();
      jQuery('.loading-field-spinner.group_location').removeClass('active')
      window.load_mapbox()
      window.force_values = false
    })

}

window.intro_home = () => {

  introJs().setOptions({
    steps: [
      {
        element: document.querySelector('#menu-icon'),
        intro: `<h1>Menu</h1>Access the side menu for help and other views.<br><br><img src="${jsObject.intro_images}open-menu.gif" />`
      },
      {
        element: document.querySelector('.dd-new-item'),
        intro: `<h1>Add New Groups</h1>Add new groups by clicking here.<br><br><img src="${jsObject.intro_images}create-new-item.gif" />`
      },
      {
        intro: `<h1>Set Generations</h1>You can arrange groups according to generation by just dragging them under their parent church.<br><br><img src="${jsObject.intro_images}nesting-generations.gif" /><br>`
      }
    ]
  }).start();

  Cookies.set('portal_app_groups_intro', true )
}


