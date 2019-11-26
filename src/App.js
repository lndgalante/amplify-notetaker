import React, { useState, useEffect } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'

// Queries
import { listNotes } from './graphql/queries'

// Mutations
import { createNote, deleteNote, updateNote } from './graphql/mutations'

// Suscriptions
import { onCreateNote } from './graphql/subscriptions'

/* Users:
Urhen123123
d1821039@urhen.com
*/

function App() {
  const [noteId, setNoteId] = useState('')
  const [newNote, setNewNote] = useState('')
  const [notes, setNotes] = useState([{ id: 1, note: 'Hello world' }])

  useEffect(() => {
    getInitialNotes()

    /* API.graphql(graphqlOperation(onCreateNote)).subscribe({
      next: noteData => {
        const newNote = noteData.value.data.onCreateNote
        const newNotes = notes.filter(note => note.id !== newNote.id)

        setNotes(prevNotes => [...newNotes, newNote.data.createNote])
      },
    }) */
  }, [])

  async function getInitialNotes() {
    const notesData = await API.graphql(graphqlOperation(listNotes))
    setNotes(notesData.data.listNotes.items)
  }

  const handleNewNoteChange = ({ target }) => setNewNote(target.value)

  const handleSubmit = async event => {
    event.preventDefault()

    // Check if we have an existing note, if so update it
    const hasExistingNote = notes.find(({ id }) => id === noteId)
    if (hasExistingNote) return handleUpdateNote()

    const input = { note: newNote }
    const newNoteSaved = await API.graphql(graphqlOperation(createNote, { input }))

    setNewNote('')
    setNotes(prevNotes => [...prevNotes, newNoteSaved.data.createNote])
  }

  const handleUpdateNote = async () => {
    const input = { id: noteId, note: newNote }
    const existingNoteUpdate = await API.graphql(graphqlOperation(updateNote, { input }))

    setNotes(prevNotes =>
      prevNotes.map(note => {
        return note.id === existingNoteUpdate.data.updateNote.id ? existingNoteUpdate.data.updateNote : note
      })
    )
  }

  const handleDeleteNote = async id => {
    const input = { id }
    const newNoteRemoved = await API.graphql(graphqlOperation(deleteNote, { input }))

    setNotes(prevNotes => prevNotes.filter(prevNote => prevNote.id !== newNoteRemoved.data.deleteNote.id))
  }

  const handleSetNote = async ({ id, note }) => {
    setNoteId(id)
    setNewNote(note)
  }

  return (
    <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
      <h1 className='code f2-l'>Amplify Notetaker</h1>

      <form className='mb3' onSubmit={handleSubmit}>
        <input
          type='text'
          placeholder='Write your note'
          className='pa2 f4'
          value={newNote}
          onChange={handleNewNoteChange}
        />
        <button type='submit' className='pa2 f4'>
          {noteId ? 'Update Note' : 'Add Note'}
        </button>
      </form>

      <div>
        {notes.map(item => (
          <div key={item.id} className='flex items-center'>
            <li onClick={() => handleSetNote(item)} className='list pa1 f3 pointer'>
              {item.note}
            </li>
            <button className='bg-transparent bn f4 pointer' onClick={() => handleDeleteNote(item.id)}>
              <span>&times;</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default withAuthenticator(App, { includeGreetings: true })
