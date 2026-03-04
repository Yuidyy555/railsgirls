import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["card", "listBody"]
  
  connect() {
    this.setupDragAndDrop()
  }

  setupDragAndDrop() {
    this.cardTargets.forEach(card => {
      card.addEventListener("dragstart", this.handleDragStart.bind(this))
      card.addEventListener("dragend", this.handleDragEnd.bind(this))
    })

    this.listBodyTargets.forEach(listBody => {
      listBody.addEventListener("dragover", this.handleDragOver.bind(this))
      listBody.addEventListener("drop", this.handleDrop.bind(this))
      listBody.addEventListener("dragenter", this.handleDragEnter.bind(this))
      listBody.addEventListener("dragleave", this.handleDragLeave.bind(this))
    })
  }

  handleDragStart(event) {
    const card = event.currentTarget
    card.classList.add("dragging")
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/html", card.outerHTML)
    event.dataTransfer.setData("card-id", card.dataset.cardId)
    event.dataTransfer.setData("list-id", card.closest(".kanban-list-body").dataset.listId)
  }

  handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging")
    this.listBodyTargets.forEach(listBody => {
      listBody.classList.remove("drag-over")
    })
  }

  handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    
    const listBody = event.currentTarget
    const draggingCard = document.querySelector(".dragging")
    
    if (draggingCard && listBody !== draggingCard.parentElement) {
      const afterElement = this.getDragAfterElement(listBody, event.clientY)
      if (afterElement == null) {
        listBody.appendChild(draggingCard)
      } else {
        listBody.insertBefore(draggingCard, afterElement)
      }
    }
  }

  handleDragEnter(event) {
    event.preventDefault()
    event.currentTarget.classList.add("drag-over")
  }

  handleDragLeave(event) {
    event.currentTarget.classList.remove("drag-over")
  }

  handleDrop(event) {
    event.preventDefault()
    const listBody = event.currentTarget
    listBody.classList.remove("drag-over")

    const cardId = event.dataTransfer.getData("card-id")
    const oldListId = event.dataTransfer.getData("list-id")
    const newListId = listBody.dataset.listId

    if (oldListId === newListId) {
      // 同じリスト内での移動は位置の更新のみ
      this.updateCardPositions(newListId, event)
    } else {
      // 別のリストへの移動
      this.moveCardToNewList(cardId, oldListId, newListId, listBody, event)
    }
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".kanban-card:not(.dragging)")]
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2
      
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child }
      } else {
        return closest
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element
  }

  updateCardPositions(listId, dropEvent) {
    const listBody = document.querySelector(`[data-list-id="${listId}"]`)
    const cards = listBody.querySelectorAll(".kanban-card")
    const boardId = window.location.pathname.split("/")[2]
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                      document.querySelector('input[name="authenticity_token"]')?.value
    
    // ドラッグ中のカードの位置を取得
    const draggingCard = document.querySelector(".dragging")
    if (!draggingCard) return
    
    const cardId = draggingCard.dataset.cardId
    const newPosition = Array.from(cards).indexOf(draggingCard)
    
    fetch(`/boards/${boardId}/lists/${listId}/cards/${cardId}/move`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        new_list_id: listId,
        new_position: newPosition
      })
    }).then(response => {
      if (response.ok) {
        // 成功時はリロードしない（スムーズなUXのため）
        draggingCard.classList.remove("dragging")
      } else {
        window.location.reload()
      }
    }).catch(error => {
      console.error("Error updating card position:", error)
      window.location.reload()
    })
  }

  moveCardToNewList(cardId, oldListId, newListId, newListBody, dropEvent) {
    const card = document.querySelector(`[data-card-id="${cardId}"]`)
    const boardId = window.location.pathname.split("/")[2]
    
    // カードを新しいリストに移動
    const afterElement = this.getDragAfterElement(newListBody, dropEvent.clientY)
    if (afterElement) {
      newListBody.insertBefore(card, afterElement)
    } else {
      newListBody.appendChild(card)
    }

    // 位置を計算
    const cards = newListBody.querySelectorAll(".kanban-card")
    const newPosition = Array.from(cards).indexOf(card)

    // サーバーに移動を通知
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                      document.querySelector('input[name="authenticity_token"]')?.value
    
    fetch(`/boards/${boardId}/lists/${oldListId}/cards/${cardId}/move`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        new_list_id: newListId,
        new_position: newPosition
      })
    }).then(response => {
      if (response.ok) {
        // ページをリロードして最新の状態を反映
        window.location.reload()
      } else {
        console.error("Failed to move card")
        window.location.reload()
      }
    }).catch(error => {
      console.error("Error moving card:", error)
      window.location.reload()
    })
  }
}

