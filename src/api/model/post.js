module.exports = class extends think.Model {
  get relation() {
    return {
      user: {
        model: 'user',
        type: think.Model.BELONG_TO,
        key: 'user_id',
        field: "id, nickname, avatar"
      }
    }
  }
}