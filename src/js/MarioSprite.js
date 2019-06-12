import Phaser from 'phaser';
import MarioInputs from './MarioInputs';
import MarioStates from './MarioStates';

/**
 * @classdesc
 * Represents a Mario Sprite.
 * 
 * @class MarioSprite
 * @extends Phaser.GameObjects.GameObject
 * 
 * @param {Phaser.Scene} scene
 * @param {number} x
 * @param {number} y
 * @param {string} texture
 * @param {number} frame
 */
export default class MarioSprite extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);

    // Create inputs
    this.inputs = new MarioInputs(this.scene);
    
    // Add Sprite to Scene
    this.scene.add.existing(this);
    
    // Enable physics
    this.scene.physics.world.enable(this);

    // Set physics body size
    this.body.setSize(16, 24);
    this.body.setOffset(0, 8);

    // Set collide world bounds to true
    this.body.setCollideWorldBounds(true);
    
    // Set custom properties
    this.setData('jumpVelocity', -256);
    this.setData('walkVelocity', 128);
    
    // Create animations
    this.scene.anims.create({
      key: 'stand',
      frameRate: 0,
      frames: this.scene.anims.generateFrameNumbers('player', {
        start: 0
      })
    });

    this.scene.anims.create({
      key: 'walk',
      frameRate: 12,
      frames: this.scene.anims.generateFrameNumbers('player', {
        start: 0,
        end: 2
      }),
      repeat: -1
    }); 

    this.scene.anims.create({
      key: 'jump',
      frameRate: 0,
      frames: this.scene.anims.generateFrameNumbers('player', {
        start: 2
      })
    });

    this.scene.anims.create({
      key: 'crouch',
      frameRate: 0,
      frames: this.scene.anims.generateFrameNumbers('player', {
        start: 3
      })
    });

    // Define actions
    this.actions = {
      jump: () => {
        this.setState(MarioStates.JUMPING);
        this.play('jump');
        this.body.velocity.y = this.getData('jumpVelocity');
        this.jumpTimer = this.scene.time.addEvent({
          delay: 500,
          callback: this.actions.fall
        });
      },
      walk: () => {
        this.setState(MarioStates.WALKING);
        this.play('walk');
      },
      crouch: () => {
        this.setState(MarioStates.CROUCHING);
        this.play('crouch');
      },
      fall: () => {
        this.setState(MarioStates.FALLING);
        this.play('jump');
      },
      stand: () => {
        this.setState(MarioStates.STANDING);
        this.play('stand');
        if (this.jumpTimer) {
          this.jumpTimer.destroy();
        }
      },
      flip: () => {
        this.setFlipX(!this.flipX);
      }
    }

    // Define checks
    this.check = {
      isWalking: () => this.body.onFloor() && (this.inputs.left || this.inputs.right),
      isJumping: () => this.body.onFloor() && this.inputs.jump,
      isCrouching: () => this.body.onFloor() && this.inputs.down,
      isFlipping: () => (this.inputs.left && !this.flipX) || (this.inputs.right && this.flipX),
      isOnFloor: () => this.body.onFloor()
    }
  }

  /**
   * Update this Sprite.
   *
   * @param {number} time - The current timestamp.
   * @param {number} delta - The delta time, in ms, elapsed since the last frame.
   */
  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    
    // Get this Sprite's x velocity
    const velocityX = (this.inputs.right ? 1 : this.inputs.left ? -1 : 0) * this.getData('walkVelocity');
    
    // Face this Sprite in the correct direction
    this.setFlipX(this.inputs.left ? true : this.inputs.right ? false : this.flipX);

    // Update this Sprite's state
    switch (this.state) {

      // If standing
      case MarioStates.STANDING:
        this.body.setVelocity(0, 0);
        
        if (this.check.isJumping()) {
          this.actions.jump();
        } else if (this.check.isWalking()) {
          this.actions.walk();
        } else if (this.check.isCrouching()) {
          this.actions.crouch();
        } else if (!this.check.isOnFloor()) {
          this.actions.fall();
        } else if (this.check.isFlipping()) {
          this.actions.flip();
        }
        break;

      // If walking
      case MarioStates.WALKING:
        this.body.setVelocity(velocityX, 0);

        if (this.check.isJumping()) {
          this.actions.jump();
        } else if (!this.check.isOnFloor()) {
          this.actions.fall();
        } else if (!this.check.isWalking()) {
          this.actions.stand();
        } else if (this.check.isFlipping()) {
          this.actions.flip();
        }
        break;

      // If crouching
      case MarioStates.CROUCHING:
        this.body.setVelocity(0, 0);

        if (!this.check.isCrouching()) {
          this.actions.stand();
        } else if (this.check.isFlipping()) {
          this.actions.flip();
        }
        break;

      // If falling or jumping
      case MarioStates.FALLING:
      case MarioStates.JUMPING:
        this.body.setVelocityX(velocityX);

        if (this.check.isOnFloor()) {
          this.actions.stand();
        } else if (this.check.isFlipping()) {
          this.actions.flip();
        }
        break;
    }
  }
}
