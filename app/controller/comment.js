'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');
class CommentController extends Controller {
  async getComment() {
    const { sourse, _id } = this.ctx.request.query;
    const { user } = this.ctx;
    // 如果 sourse 是 thread
    if (sourse === 'thread') {
      const comments = await this.ctx.model.Comment.find({ threadSourceId: _id });
      this.ctx.body = { success: true, comments };
      return;
    }
    // 如果 sourse 是 comment
    if (sourse === 'comment') {

    }
  }
  async praise() {
    const { _id } = this.ctx.request.body;
    const { user } = this.ctx;
    if (!user) {
      this.ctx.body = { success: false, message: '请先登录' };
      return;
    }
    // 判断该thread中是否已经有了该用户的点赞
    let flag = false;
    const comment = await this.ctx.model.Comment.findOne({ _id });
    for (const praiseInfo of comment.praiseInfo) {
      if (_.isEqual(praiseInfo.uid === user._id)) {
        flag = true;
        break;
      }
    }
    if (flag) {
      this.ctx.body = { success: false, message: '该用户已经为此条comment点过赞了' };
      return;
    }
    const updateRes = await this.ctx.model.Comment.update({ _id }, { $inc: { praises: 1 }, $push: { praiseInfo: { avatarUrl: user.avatarUrl, openid: user.openid } } });
    if (updateRes.ok) {
      this.ctx.body = { success: true };
      return;
    }
    this.ctx.body = { success: false };
  }
  async cancelPraise() {
    const { _id } = this.ctx.request.body;
    const { user } = this.ctx;
    if (!user) {
      this.ctx.body = { success: false, message: '请先登录' };
      return;
    }
    // 判断该thread中是否已经有了该用户的点赞
    let flag = false;
    const comment = await this.ctx.model.Comment.findOne({ _id });
    for (const praiseInfo of comment.praiseInfo) {
      if (_.isEqual(praiseInfo.uid === user._id)) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      this.ctx.body = { success: false, message: '该用户没有未此条comment点过赞' };
      return;
    }
    const updateRes = await this.ctx.model.Comment.update({ _id }, { $inc: { praises: -1 }, $pull: { praiseInfo: { avatarUrl: user.avatarUrl, openid: user.openid } } });
    if (updateRes.ok) {
      this.ctx.body = { success: true };
      return;
    }
    this.ctx.body = { success: false };
  }
}

module.exports = CommentController;