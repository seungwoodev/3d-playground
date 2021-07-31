import { vertexShader, fragmentShader } from './shaders'
import Tween from './tween'
import * as THREE from '../../node_modules/three/build/three.module.js'

const DEG2RAD = Math.PI / 180

class Particle {
  
  constructor() {
    
    this.position = new THREE.Vector3()
    this.velocity = new THREE.Vector3()
    this.acceleration = new THREE.Vector3()
    
    this.angle = 0
    this.angleVelocity = 0
    this.angleAcceleration = 0
    this.size = 16
    this.color = new THREE.Color()
    this.opacity = 1

    this.age = 0
    this.alive = 0

    this.sizeTween = null
    this.colorTween = null
    this.opacityTween = null
  }

  update(udt) {
    this.position.add(this.velocity.clone().multiplyScalar(udt))
    this.velocity.add(this.acceleration.clone().multiplyScalar(udt))
    this.angle += this.angleVelocity * DEG2RAD * udt
    this.angleVelocity += this.angleAcceleration * DEG2RAD * udt
    this.age += udt

    if(this.sizeTween.times.length > 0) {
      this.size = this.sizeTween.lerp(this.age)
    }

    if(this.colorTween.times.length > 0) {
      const colorHSL = this.colorTween.lerp(this.age)
      this.color = new THREE.Color().setHSL(colorHSL.x, colorHSL.y, colorHSL.z)
    }

    if(this.opacityTween.times.length > 0) {
      this.opacity = this.opacityTween.lerp(this.age)
    }
  }

}

export default Particle