import * as controller from "./lib/controlfirst.js"; //допоміжна бібліотека з механікою камери
import * as pb from "./PlaceBreak.js" //назва говорить сама за себе
var box = null;

function calcObjIntersection(objects) {
    var raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 20);
    raycaster.ray.origin.copy(camera.position);
    raycaster.ray.origin.y -= 20;
    var intersections = raycaster.intersectObjects(objects);
    return intersections.length > 0;
    //як це працює?
    //raycaster посилає промінь, якщо він зіштовхується - то тоді вертаємо true
    //https://threejs.org/docs/index.html#api/en/core/Raycaster
    //це для стрибання
}

document.addEventListener('postInit', function() {
    var controls = new controller.PointerLockControls(window.camera);
    window.controlsIsLocked = function() { return controls.isLocked; };
    var blocker = document.getElementById('blocker');
    blocker.addEventListener('click', function() { controls.lock(); }, false);
    controls.addEventListener('lock', function() { blocker.style.display = 'none'; });
    controls.addEventListener('unlock', function() { blocker.style.display = 'block'; });

    var velocity = new THREE.Vector3(); //сила
    var direction = new THREE.Vector3(); //напрям

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var canJump = true;

    var onKeyDown = function(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if (canJump === true) velocity.y += 350;
                canJump = false;
                break;
            case 45: //insert
                pb.checkclick(false);
                break;
            case 46: //delete
                pb.checkclick(true);
                break;
            case 70: //f
                onfullscreen();
                break;
        }
    };

    var onKeyUp = function(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
            case 70: //f
                onfullscreen();
                break;
        }
        switch (event.key) {
            case "Home": //home
                camera.position.x = 0;
                camera.position.z = 0;
                break;
            case "1":
                pb.select(0); //вибір матеріала
                break;
            case "2":
                pb.select(1);
                break;
            case "3":
                pb.select(2);
                break;
            case "4":
                pb.select(3);
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);


    var boxGeometry = new THREE.BoxBufferGeometry(20, 20, 20);
    var cubeMaterial = new THREE.MeshLambertMaterial({ map: new THREE.TextureLoader().load('/static/textures/grass.png') })
    box = new THREE.Mesh(boxGeometry, cubeMaterial);
    box.bbox = new THREE.Box3().setFromObject(box);
    camera.add(box) // НЕ ПОТРіБНО, просто для експериментів з зіштовхуваннями

    //show world coordinates
    var axesHelper = new THREE.AxesHelper(100);
    //shift up by 10 units
    axesHelper.position.y = 10;
    scene.add(axesHelper);


    document.addEventListener('animateEvent', function(params) {
        var delta = params.delta;
        velocity.x -= velocity.x * 8.0 * delta; //інерція 
        velocity.z -= velocity.z * 8.0 * delta;
        //velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.normalize(); // this ensures consistent movements in all directions
        // ЕКСПЕРИМЕНТ

        var cameraBBOX = new THREE.Box3().setFromObject(window.camera);


        if (moveForward || moveBackward) velocity.z -= direction.z * 500.0 * delta; //500
        if (moveLeft || moveRight) velocity.x -= direction.x * 500.0 * delta;
        document.getElementById('alerter').innerHTML = "ok";
        window.objects.forEach(obj => {
            obj.bbox = new THREE.Box3().setFromObject(obj);

            if (obj.bbox.intersectsBox(cameraBBOX) == true) {
                document.getElementById('alerter').innerHTML = "collision";

                // calculate normal vector 
                var normal = new THREE.Vector3();
                normal.subVectors(camera.position, obj.position);
                normal.y = 0;
                normal.normalize();

                //show the normal vector
                var normalHelper = new THREE.ArrowHelper(normal, obj.position, 30, 0xff0000);
                scene.add(normalHelper);

                //get the camera rotation 
                console.log(window.camera.rotation);


                // Transform the collision normal into the camera's local space
                var normalPlayer = normal.clone();
                normalPlayer.y = 0;
                normalPlayer.x = -normalPlayer.x;
                normalPlayer.applyQuaternion(window.camera.quaternion);
                normalPlayer.y = 0;
                // Normalize the transformed normal
                normalPlayer.normalize();

                //show the normal vector
                var arrowHelper3 = new THREE.ArrowHelper(normalPlayer, obj.position, 30, 0x00ff00);
                window.scene.add(arrowHelper3);

                //cancel the movement in the direction of the normal vector
                velocity.x -= normalPlayer.x * 500.0 * delta;
                velocity.z += normalPlayer.z * 500.0 * delta;
            }

        });


        if (calcObjIntersection(window.objects) == true) { //вертикальне зіткнення
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
        }

        controls.moveRight(velocity.x * delta);
        //window.camera.position.y += velocity.y * delta;
        controls.moveForward(-velocity.z * delta);
        if (window.camera.position.y < 25) { //щоб ми не падали
            velocity.y = 0;
            camera.position.y = 25;
            canJump = true;
        }
    });
});