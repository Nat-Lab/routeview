var rs_ctrl = (function () {

  var filter, _filter, view, input, serv_id, max_rslt, loaded = false;

  view = document.getElementById('view');
  input = document.getElementById('input');
  serv_id = document.getElementById('server_id');
  max_rslt = document.getElementById('max_res');
  sid_ = document.getElementById('server_id');

  document.getElementById('input').addEventListener('keydown', e => { if(e.keyCode == 13) rs_ctrl.update_view() });
  document.getElementById('max_res').addEventListener('keydown', e => { if(e.keyCode == 13) rs_ctrl.update_view() });
  String.prototype.netOf = function(ip) { return ipaddr.parse(ip).match(ipaddr.parseCIDR(this.toString())); };

  var router_servers = [
    { name: 'Vultr JP (IPv6)',
      url: 'http://141.193.21.2/routes6.json', 
      data: [],
      id: 0,
      ipv6: true
    },
    { name: 'Hurricane Electric HK (IPv6)',
      url: 'http://123.103.252.145/routes.json',
      data: [],
      id: 1,
      ipv6: true
    },
    { name: 'Vultr JP (IPv4)',
      url: 'http://141.193.21.2/routes.json',
      data: [],
      id: 2,
      ipv6: false
    }
  ];

  var fetch_data = url => new Promise((res, rej) => {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function () {
      if (this.status == 200) {
        res(JSON.parse(xhr.response).filter(r => r.as_path));
      } else rej(xhr.statusText);
    };
    xhr.onerror = err => rej(err);
    xhr.send();
  });

  router_servers.forEach(rs => {
    fetch_data(rs.url).then(r => {
      rs.data = r;
      var sel = document.createElement('option');
      sel.setAttribute('value', rs.id);
      sel.innerHTML = rs.name;
      if (!loaded) {
        loaded = true;
        sid_.innerHTML = '';
      }
      sid_.appendChild(sel);
    });
  });

  var get_routes = server_id => {
    try {
      var _rslt = router_servers[server_id].data.filter(r => eval(input.value));
      input.className = '';
      return _rslt;
    } catch (e) {
      console.error('Filter Error: ' + e);
      input.className = 'error';
    }
  };

  var tr = function(tds) {
    var resultTR = document.createElement('tr');
    tds.forEach(td => {
      var resultTD = document.createElement('td');
      resultTD.innerHTML = td.v;
      resultTD.className = td.c;
      resultTR.appendChild(resultTD);
    });
    return resultTR;
  };

  var update_view = function() {
    var resultHTML = document.createElement('div');
    resultHTML.className = 'disp';
    var results = get_routes(serv_id.value);
    var max = Number.parseInt(max_rslt.value);
    max = Number.isInteger(max) && max > 0 ? max : 10;
    results = results.slice(-1 * max);
    results.forEach(rou => {
      var table = document.createElement('table');
      var tbody = document.createElement('tbody');
      tbody.appendChild(new tr([{c: 't_route', v: rou.route}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Via'}, {c: 't_var', v: rou.via}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Device'}, {c: 't_var', v: rou.dev}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'AS Path'}, {c: 't_var', v: rou.as_path.toString().replace(/,/g, ' ')}]));
      tbody.appendChild(new tr([{c: 't_dhead', v: 'Nexthop'}, {c: 't_var', v: rou.next_hop.toString().replace(/,/g, ' ')}]));
      if (rou.bgp_community) tbody.appendChild(new tr([{c: 't_dhead', v: 'Community'}, {c: 't_var', v: rou.bgp_community.toString().replace(/,/g, ' ')}]));
      table.appendChild(tbody);
      resultHTML.appendChild(table);
    });
    view.innerHTML = '';
    view.appendChild(resultHTML);
  };

  return {
    update_view
  };
})();
