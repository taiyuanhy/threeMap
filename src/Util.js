import Const from '../src/Const.js'
let Util = {
//OpenStreetMap行列号转经纬度
//这里的经纬度是左上角的经纬度
    num2deg: function (x, y, z) {
        var lon = (x / Math.pow(2, z) * 360 - 180);
        var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
        var lat = (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
        return [lon, lat]
    },
//WGS84转Web墨卡托
//参考：http://www.opengsc.com/archives/137
    LonLat2WebMercator: function (lng, lat) {
        var x = (lng / 180.0) * Const.worldWidth;
        var y;
        if (lat > 85.05112) {
            lat = 85.05112;
        }
        if (lat < -85.05112) {
            lat = -85.05112;
        }
        y = (Math.PI / 180.0) * lat;
        var tmp = Math.PI / 4.0 + y / 2.0;
        y = Const.worldWidth * Math.log(Math.tan(tmp)) / Math.PI;
        return [x,y];
    },

    WebMercator2LonLat: function (x, y) {
        let lon = x / Const.worldWidth * 180;
        let lat = y / Const.worldWidth * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return [lon, lat];
    },

//Web墨卡托转成tile上的像素坐标，返回像素坐标，以及tile编号，在所在tile上的偏移
    LonLat2Num: function (lon, lat, zoom) {
        var x = (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
        var y = (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
        return [x, y];
    },

//经纬度到tile，再到WebGL坐标
    LonLat2WebGL: function (lng, lat) {
        var webMercator = this.LonLat2WebMercator(lng, lat);
        webMercator[2] = 0;
        return webMercator;
    },

    /**
     * 屏幕坐标转经纬度
     * @param x
     * @param y
     */
    screenXYToLonlat: function (x, y,width,height) {
        let mercatorXY = this.screenXYToMercator(x, y,width,height);
        let lonlat = this.WebMercator2LonLat(mercatorXY[0], mercatorXY[1]);
        return lonlat;
    },

    screenXYToMercator: function (x, y,width,height) {
        let camera = this.camera;
        var vec = new THREE.Vector3(); // create once and reuse
        var pos = new THREE.Vector3(); // create once and reuse
        vec.set(
            ( x / width ) * 2 - 1,
            -( y / height ) * 2 + 1,
            0);
        vec.unproject(camera);
        vec.sub(camera.position).normalize();
        var distance = -camera.position.z / vec.z;
        pos.copy(camera.position).add(vec.multiplyScalar(distance));
        return [pos.x, pos.y];
    },

    xyToLonlat: function (x, y) {
        let lonlat;
        let vec = new THREE.Vector3();
        vec.x = ( x / maxScreenX ) * 2 - 1;
        vec.y = -( y / maxScreenY ) * 2 + 1;
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(vec, camera);
        var intersects = raycaster.intersectObjects(scene.children);
        // if there is one (or more) intersections
        if (intersects.length > 0) {
            let pos = intersects[0].point;
            lonlat = WebMercator2LonLat(pos.x, pos.y);
        }
        return lonlat;
    },

    getZoom: function (minScreenX,minScreenY,maxScreenX,maxScreenY) {
        let leftTop = this.screenXYToMercator(minScreenX, minScreenY,maxScreenX,maxScreenY);
        let rightBottom = this.screenXYToMercator(maxScreenX, maxScreenY,maxScreenX,maxScreenY);
        let realWidth = rightBottom[0] - leftTop[0];
        let res = realWidth / maxScreenX;
        return this.resToZoom(res);
    },

    resToZoom: function (res) {
        let temp = 2 * Math.PI * Const.earthRadius / (Const.tileSize * res);
        let zoom = Math.log(temp) / Math.log(2);
        zoom = Math.floor(zoom);
        return zoom;
    },

    zoomToRes: function (zoom) {
        var resolution = 2 * Math.PI * Const.earthRadius / (Math.pow(2, zoom) * Const.tileSize);
        return resolution;
    }
}
export default Util;