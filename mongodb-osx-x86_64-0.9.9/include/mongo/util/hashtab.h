/**
*    Copyright (C) 2008 10gen Inc.
*
*    This program is free software: you can redistribute it and/or  modify
*    it under the terms of the GNU Affero General Public License, version 3,
*    as published by the Free Software Foundation.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU Affero General Public License for more details.
*
*    You should have received a copy of the GNU Affero General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/* hashtab.h

   Simple, fixed size hash table.  Darn simple.

   Uses a contiguous block of memory, so you can put it in a memory mapped file very easily.
*/

#pragma once

#include "../stdafx.h"
#include <map>

namespace mongo {

#pragma pack(1)

    /* you should define:

       int Key::hash() return > 0 always.
    */

    template <
    class Key,
    class Type
    >
    class HashTable {
    public:
        const char *name;
        struct Node {
            int hash;
            Key k;
            Type value;
            bool inUse() {
                return hash != 0;
            }
            void setUnused() {
                hash = 0;
            }
        } *nodes;
        int n;
        int maxChain;

        int _find(const Key& k, bool& found) {
            found = false;
            int h = k.hash();
            int i = h % n;
            int start = i;
            int chain = 0;
            while ( 1 ) {
                if ( !nodes[i].inUse() ) {
                    return i;
                }
                if ( nodes[i].hash == h && nodes[i].k == k ) {
                    found = true;
                    return i;
                }
                chain++;
                i = (i+1) % n;
                if ( i == start ) {
                    // shouldn't get here / defensive for infinite loops
                    out() << "error: hashtable " << name << " is full n:" << n << endl;
                    return -1;
                }
                if( chain >= maxChain ) { 
                    out() << "error: hashtable " << name << " max chain n:" << n << endl;
                    return -1;
                }
                if ( chain == 200 )
                    out() << "warning: hashtable " << name << " long chain " << endl;
            }
        }

    public:
        /* buf must be all zeroes on initialization. */
        HashTable(void *buf, int buflen, const char *_name) : name(_name) {
            int m = sizeof(Node);
            // out() << "hashtab init, buflen:" << buflen << " m:" << m << endl;
            n = buflen / m;
            if ( (n & 1) == 0 )
                n--;
            maxChain = (int) (n * 0.05);
            nodes = (Node *) buf;

            assert( sizeof(Node) == 628 );
            //out() << "HashTable() " << _name << " sizeof(node):" << sizeof(Node) << " n:" << n << endl;
        }

        Type* get(const Key& k) {
            bool found;
            int i = _find(k, found);
            if ( found )
                return &nodes[i].value;
            return 0;
        }

        void kill(const Key& k) {
            bool found;
            int i = _find(k, found);
            if ( i >= 0 && found ) {
                nodes[i].k.kill();
                nodes[i].setUnused();
            }
        }

        void drop(const Key& k) {
            bool found;
            int i = _find(k, found);
            if ( i >= 0 && found ) {
                nodes[i].setUnused();
            }
        }

        /** returns false if too full */
        bool put(const Key& k, const Type& value) {
            bool found;
            int i = _find(k, found);
            if ( i < 0 )
                return false;
            if ( !found ) {
                nodes[i].k = k;
                nodes[i].hash = k.hash();
            }
            else {
                assert( nodes[i].hash == k.hash() );
            }
            nodes[i].value = value;
            return true;
        }

    };

#pragma pack()

} // namespace mongo
