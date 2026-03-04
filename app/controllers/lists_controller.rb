class ListsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_board
  before_action :set_list, only: %i[ update destroy ]

  # POST /boards/:board_id/lists or /boards/:board_id/lists.json
  def create
    @list = @board.lists.build(list_params)
    @list.position = @board.lists.count

    respond_to do |format|
      if @list.save
        format.html { redirect_to @board, notice: "リストが作成されました！" }
        format.json { render json: @list, status: :created }
      else
        format.html { redirect_to @board, alert: "リストの作成に失敗しました。" }
        format.json { render json: @list.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /boards/:board_id/lists/1 or /boards/:board_id/lists/1.json
  def update
    respond_to do |format|
      if @list.update(list_params)
        format.html { redirect_to @board, notice: "リストが更新されました！" }
        format.json { render json: @list, status: :ok }
      else
        format.html { redirect_to @board, alert: "リストの更新に失敗しました。" }
        format.json { render json: @list.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /boards/:board_id/lists/1 or /boards/:board_id/lists/1.json
  def destroy
    @list.destroy!

    respond_to do |format|
      format.html { redirect_to @board, notice: "リストが削除されました！", status: :see_other }
      format.json { head :no_content }
    end
  end

  private
    def set_board
      @board = current_user.boards.find(params[:board_id])
    end

    def set_list
      @list = @board.lists.find(params[:id])
    end

    def list_params
      params.require(:list).permit(:name, :position)
    end
end


