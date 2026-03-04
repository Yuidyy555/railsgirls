class CardsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_board
  before_action :set_list
  before_action :set_card, only: %i[ show edit update destroy ]

  # GET /boards/:board_id/lists/:list_id/cards/1
  def show
  end

  # GET /boards/:board_id/lists/:list_id/cards/new
  def new
    @card = @list.cards.build
  end

  # GET /boards/:board_id/lists/:list_id/cards/1/edit
  def edit
  end

  # POST /boards/:board_id/lists/:list_id/cards or /boards/:board_id/lists/:list_id/cards.json
  def create
    @card = @list.cards.build(card_params)
    @card.position = @list.cards.count

    respond_to do |format|
      if @card.save
        format.html { redirect_to @board, notice: "カードが作成されました！" }
        format.json { render json: @card, status: :created }
      else
        format.html { redirect_to @board, alert: "カードの作成に失敗しました。" }
        format.json { render json: @card.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /boards/:board_id/lists/:list_id/cards/1 or /boards/:board_id/lists/:list_id/cards/1.json
  def update
    respond_to do |format|
      if @card.update(card_params)
        format.html { redirect_to @board, notice: "カードが更新されました！" }
        format.json { render json: @card, status: :ok }
      else
        format.html { redirect_to @board, alert: "カードの更新に失敗しました。" }
        format.json { render json: @card.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /boards/:board_id/lists/:list_id/cards/1 or /boards/:board_id/lists/:list_id/cards/1.json
  def destroy
    @card.destroy!

    respond_to do |format|
      format.html { redirect_to @board, notice: "カードが削除されました！", status: :see_other }
      format.json { head :no_content }
    end
  end

  # PATCH /boards/:board_id/lists/:list_id/cards/:id/move
  def move
    @card = Card.find(params[:id])
    new_list = @board.lists.find(params[:new_list_id])
    new_position = params[:new_position].to_i

    old_list = @card.list
    old_position = @card.position

    if old_list.id == new_list.id
      # 同じリスト内での移動
      if new_position > old_position
        # 下に移動
        old_list.cards.where("position > ? AND position <= ?", old_position, new_position)
                .update_all("position = position - 1")
      else
        # 上に移動
        old_list.cards.where("position >= ? AND position < ?", new_position, old_position)
                .update_all("position = position + 1")
      end
      @card.update(position: new_position)
    else
      # 別のリストへの移動
      # 古いリストの位置を調整
      old_list.cards.where("position > ?", old_position).update_all("position = position - 1")
      
      # 新しいリストの位置を調整
      new_list.cards.where("position >= ?", new_position).update_all("position = position + 1")
      
      @card.update(list: new_list, position: new_position)
    end

    respond_to do |format|
      format.json { render json: @card, status: :ok }
    end
  end

  private
    def set_board
      @board = current_user.boards.find(params[:board_id])
    end

    def set_list
      @list = @board.lists.find(params[:list_id])
    end

    def set_card
      @card = @list.cards.find(params[:id])
    end

    def card_params
      params.require(:card).permit(:title, :description, :position)
    end
end

