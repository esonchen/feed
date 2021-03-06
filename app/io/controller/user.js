'use strict';


module.exports = app => {
  class Controller extends app.Controller {
    async init() {
      console.log('init...');

      const uid = this.ctx.args[0];
      if (!uid) {
        return;
      }
      const user = await this.ctx.model.User.findOne({ _id: uid });
      if (!user) {
        return;
      }
      const notifies = await this.ctx.model.Notify.find({ uid, hasRead: false }).sort({ _id: -1 });
      this.ctx.socket.emit('res', notifies);

      const Emitter = this.ctx.service.event.Emitter();
      Emitter.on('newNotify', async sourceUid => {
        if (sourceUid == uid) {
          // notify目标为此用户
          const notifies = await this.ctx.model.Notify.find({ uid, hasRead: false }).sort({ _id: -1 });
          this.ctx.socket.emit('res', notifies);
        }
      });
    }
    async adminLogin() {
      // this.ctx.socket.disconnect(true);
      const argspswd = this.ctx.args[0];
      const pswd = 'jserjser';
      await this.ctx.app.redis.set(this.ctx.socket.id, true);
      if (argspswd === pswd) {
        this.ctx.socket.emit('loginResult', 'success');
        // 获得旧的还未被审核通过的thread
        const hasntPassThread = await this.ctx.model.Thread.find({ isDelete: false || undefined, oficialCheckPass: undefined }).sort({ _id: 1 });
        console.log('登陆成功之后，获得之前所有未通过的threads');
        this.ctx.socket.emit('hasntPassThread', hasntPassThread);
        // 管理员登陆成功后，开始监听 新thread 的变化
        console.log('登陆成功开始监听');
        const Emitter = this.ctx.service.event.Emitter();
        Emitter.on('newThread', async thread => {
          this.ctx.socket.emit('newThread', thread);
        });
      } else {
        this.ctx.socket.emit('loginResult', 'fail');
      }
    }
    // 管理员对thread的操作
    async operateThread() {


      // 当前页面非管理员登陆，则return
      const flag = await this.ctx.app.redis.get(this.ctx.socket.id);
      if (!flag) {
        return;
      }
      const operation = this.ctx.args[0];
      const threadId = this.ctx.args[1];
      switch (operation) {
        case 'pass':
          await this.ctx.model.Thread.update({ _id: threadId }, { oficialCheckPass: true });
          break;
        case 'delete':
          await this.ctx.model.Thread.update({ _id: threadId }, { isDelete: true, oficialCheckPass: false });
          break;
        case 'limit':
          await this.ctx.model.Thread.update({ _id: threadId }, { onlyself: true, oficialCheckPass: false });
          break;
        default:
      }

      this.ctx.socket.emit('checkedThread', threadId);
    }
  }
  return Controller;
};
